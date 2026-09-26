import type {
  GenerateImageRequest,
  GeneratedImage,
  IImageGenerationProvider,
} from '../../contracts/services/image-generation-provider'
import { ImageGenerationError } from '../../domain/errors/image-generation-error'
import { logError } from '../../app/shared/log'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
}

const BLOCKED_FINISH_REASONS = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'IMAGE_SAFETY', 'BLOCKLIST', 'RECITATION'])

export interface GeminiImageProviderOptions {
  apiKey: string
  model: string
  timeoutMs: number
}

/** Google Gemini (edição de imagem com várias imagens de entrada) via REST */
export class GeminiImageProvider implements IImageGenerationProvider {
  readonly name = 'gemini'
  readonly model: string

  constructor(private readonly options: GeminiImageProviderOptions) {
    this.model = options.model
  }

  isConfigured(): boolean {
    return Boolean(this.options.apiKey)
  }

  async generate(request: GenerateImageRequest): Promise<GeneratedImage> {
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: request.prompt },
            ...request.images.map((image) => ({
              inlineData: { mimeType: image.mimeType, data: image.buffer.toString('base64') },
            })),
          ],
        },
      ],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }

    const response = await this.post(body)

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      logError('GeminiImageProvider.generate', { status: response.status, model: this.model }, text.slice(0, 500))
      if (response.status === 429) {
        throw new ImageGenerationError('Limite de uso da IA atingido. Tente de novo em alguns minutos.')
      }
      if (response.status >= 500) {
        throw new ImageGenerationError('O serviço de IA está instável. Tente novamente.')
      }
      throw new ImageGenerationError('Não foi possível gerar a imagem. Tente novamente.')
    }

    const data = (await response.json()) as GeminiResponse

    if (data.promptFeedback?.blockReason) {
      throw new ImageGenerationError('A IA recusou gerar esta imagem. Tente com outra foto.')
    }

    const candidate = data.candidates?.[0]
    const imagePart = candidate?.content?.parts?.find((part) => part.inlineData?.data)

    if (!imagePart?.inlineData) {
      if (candidate?.finishReason && BLOCKED_FINISH_REASONS.has(candidate.finishReason)) {
        throw new ImageGenerationError('A IA recusou gerar esta imagem. Tente com outra foto.')
      }
      const text = candidate?.content?.parts?.map((part) => part.text ?? '').join(' ').trim()
      logError('GeminiImageProvider.generate', { finishReason: candidate?.finishReason }, `sem imagem: ${text ?? ''}`)
      throw new ImageGenerationError('A IA não devolveu imagem. Tente novamente ou ajuste as instruções.')
    }

    return {
      buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
      mimeType: imagePart.inlineData.mimeType,
    }
  }

  private async post(body: unknown): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs)
    try {
      return await fetch(`${API_BASE}/${encodeURIComponent(this.model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.options.apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ImageGenerationError('A IA demorou demais para responder. Tente novamente.')
      }
      logError('GeminiImageProvider.post', { model: this.model }, error)
      throw new ImageGenerationError('Não foi possível falar com o serviço de IA. Tente novamente.')
    } finally {
      clearTimeout(timer)
    }
  }
}

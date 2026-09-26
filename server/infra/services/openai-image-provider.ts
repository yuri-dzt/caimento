import type {
  GenerateImageRequest,
  GeneratedImage,
  IImageGenerationProvider,
} from '../../contracts/services/image-generation-provider'
import { ImageGenerationError } from '../../domain/errors/image-generation-error'
import { logError } from '../../app/shared/log'

const EDITS_URL = 'https://api.openai.com/v1/images/edits'

interface OpenAIImageResponse {
  data?: Array<{ b64_json?: string }>
  output_format?: string
}

interface OpenAIErrorResponse {
  error?: { message?: string; code?: string | null; type?: string }
}

const BLOCKED_CODES = new Set(['moderation_blocked', 'content_policy_violation'])

export interface OpenAIImageProviderOptions {
  apiKey: string
  model: string
  /** low | medium | high | auto: define custo e tempo */
  quality: string
  /** 1024x1024 | 1024x1536 (retrato) | 1536x1024 | auto */
  size: string
  /** high = preserva rosto e detalhes das imagens de entrada (vazio = padrão do modelo) */
  inputFidelity: string
  timeoutMs: number
  /** Injetável para teste */
  fetchFn?: typeof fetch
}

/** OpenAI Images (edição com várias imagens de entrada) via REST multipart */
export class OpenAIImageProvider implements IImageGenerationProvider {
  readonly name = 'openai'
  readonly model: string

  constructor(private readonly options: OpenAIImageProviderOptions) {
    this.model = options.model
  }

  isConfigured(): boolean {
    return Boolean(this.options.apiKey)
  }

  async generate(request: GenerateImageRequest): Promise<GeneratedImage> {
    const form = new FormData()
    form.append('model', this.model)
    form.append('prompt', request.prompt)
    form.append('n', '1')
    form.append('size', this.options.size)
    form.append('quality', this.options.quality)
    form.append('output_format', 'png')
    if (this.options.inputFidelity) form.append('input_fidelity', this.options.inputFidelity)

    // a ordem importa: o prompt fala em "image 1", "image 2"
    request.images.forEach((image, index) => {
      const extension = image.mimeType.split('/')[1] ?? 'jpg'
      form.append('image[]', new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }), `image-${index + 1}.${extension}`)
    })

    const response = await this.post(form)

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as OpenAIErrorResponse
      const code = body.error?.code ?? ''
      logError(
        'OpenAIImageProvider.generate',
        { status: response.status, code, model: this.model },
        body.error?.message ?? 'erro sem mensagem',
      )
      if (BLOCKED_CODES.has(code)) {
        throw new ImageGenerationError('A IA recusou gerar esta imagem. Tente com outra foto.')
      }
      if (response.status === 401) {
        throw new ImageGenerationError('Chave da OpenAI inválida. Fale com o administrador.')
      }
      if (response.status === 429) {
        throw new ImageGenerationError('Limite de uso da IA atingido. Tente de novo em alguns minutos.')
      }
      if (response.status >= 500) {
        throw new ImageGenerationError('O serviço de IA está instável. Tente novamente.')
      }
      throw new ImageGenerationError('Não foi possível gerar a imagem. Tente novamente.')
    }

    const data = (await response.json()) as OpenAIImageResponse
    const b64 = data.data?.[0]?.b64_json
    if (!b64) {
      logError('OpenAIImageProvider.generate', { model: this.model }, 'resposta sem imagem')
      throw new ImageGenerationError('A IA não devolveu imagem. Tente novamente ou ajuste as instruções.')
    }

    return { buffer: Buffer.from(b64, 'base64'), mimeType: `image/${data.output_format ?? 'png'}` }
  }

  private async post(form: FormData): Promise<Response> {
    const fetchFn = this.options.fetchFn ?? fetch
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs)
    try {
      return await fetchFn(EDITS_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.options.apiKey}` },
        body: form,
        signal: controller.signal,
      })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ImageGenerationError('A IA demorou demais para responder. Tente novamente.')
      }
      logError('OpenAIImageProvider.post', { model: this.model }, error)
      throw new ImageGenerationError('Não foi possível falar com o serviço de IA. Tente novamente.')
    } finally {
      clearTimeout(timer)
    }
  }
}

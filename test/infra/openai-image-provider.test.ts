import { ImageGenerationError } from '../../server/domain/errors/image-generation-error'
import { OpenAIImageProvider } from '../../server/infra/services/openai-image-provider'

function makeProvider(response: Response | Error, overrides: { inputFidelity?: string } = {}) {
  const fetchFn = vi.fn<typeof fetch>()
  if (response instanceof Error) fetchFn.mockRejectedValue(response)
  else fetchFn.mockResolvedValue(response)

  const provider = new OpenAIImageProvider({
    apiKey: 'sk-test',
    model: 'gpt-image-1',
    quality: 'medium',
    size: '1024x1536',
    inputFidelity: overrides.inputFidelity ?? 'high',
    timeoutMs: 5000,
    fetchFn,
  })
  return { provider, fetchFn }
}

const request = {
  prompt: 'troque o tecido',
  images: [
    { buffer: Buffer.from('garment'), mimeType: 'image/jpeg' },
    { buffer: Buffer.from('fabric'), mimeType: 'image/png' },
  ],
}

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('OpenAIImageProvider', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('manda as imagens na ordem do prompt e devolve o PNG', async () => {
    const { provider, fetchFn } = makeProvider(
      json(200, { data: [{ b64_json: Buffer.from('result').toString('base64') }], output_format: 'png' }),
    )

    const result = await provider.generate(request)

    expect(result.buffer.toString()).toBe('result')
    expect(result.mimeType).toBe('image/png')

    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/images/edits')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
    const form = init?.body as FormData
    expect(form.get('model')).toBe('gpt-image-1')
    expect(form.get('size')).toBe('1024x1536')
    expect(form.get('input_fidelity')).toBe('high')
    const images = form.getAll('image[]') as File[]
    expect(images.map((file) => file.name)).toEqual(['image-1.jpeg', 'image-2.png'])
    expect(await images[0].text()).toBe('garment')
  })

  it('não envia input_fidelity quando vazio', async () => {
    const { provider, fetchFn } = makeProvider(json(200, { data: [{ b64_json: 'eA==' }] }), { inputFidelity: '' })
    await provider.generate(request)
    expect((fetchFn.mock.calls[0][1]?.body as FormData).has('input_fidelity')).toBe(false)
  })

  it('bloqueio de moderação vira mensagem amigável', async () => {
    const { provider } = makeProvider(json(400, { error: { code: 'moderation_blocked', message: 'blocked' } }))
    await expect(provider.generate(request)).rejects.toThrow('A IA recusou gerar esta imagem. Tente com outra foto.')
  })

  it('429 avisa sobre limite de uso', async () => {
    const { provider } = makeProvider(json(429, { error: { message: 'rate limit' } }))
    await expect(provider.generate(request)).rejects.toThrow('Limite de uso da IA atingido')
  })

  it('401 avisa sobre chave inválida', async () => {
    const { provider } = makeProvider(json(401, { error: { message: 'bad key' } }))
    await expect(provider.generate(request)).rejects.toThrow('Chave da OpenAI inválida')
  })

  it('resposta sem imagem é erro', async () => {
    const { provider } = makeProvider(json(200, { data: [] }))
    await expect(provider.generate(request)).rejects.toThrow(ImageGenerationError)
  })

  it('falha de rede vira erro amigável', async () => {
    const { provider } = makeProvider(new TypeError('fetch failed'))
    await expect(provider.generate(request)).rejects.toThrow('Não foi possível falar com o serviço de IA')
  })

  it('sem chave não está configurado', () => {
    const provider = new OpenAIImageProvider({
      apiKey: '',
      model: 'gpt-image-1',
      quality: 'medium',
      size: '1024x1536',
      inputFidelity: 'high',
      timeoutMs: 5000,
    })
    expect(provider.isConfigured()).toBe(false)
  })
})

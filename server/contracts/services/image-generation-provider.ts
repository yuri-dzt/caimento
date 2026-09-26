export interface ImageInput {
  buffer: Buffer
  mimeType: string
}

export interface GenerateImageRequest {
  prompt: string
  /** Imagens na ordem em que o prompt se refere a elas (imagem 1, imagem 2...) */
  images: ImageInput[]
}

export interface GeneratedImage {
  buffer: Buffer
  mimeType: string
}

export interface IImageGenerationProvider {
  readonly name: string
  readonly model: string
  isConfigured(): boolean
  generate(request: GenerateImageRequest): Promise<GeneratedImage>
}

import { AppError } from './app-error'

/** Falha do provedor de IA. A mensagem vai para a tela da simulação. */
export class ImageGenerationError extends AppError {
  constructor(message: string) {
    super(message, 502, 'IMAGE_GENERATION_ERROR')
  }
}

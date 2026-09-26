import type { ICustomerRepository } from '../../../contracts/repositories/customer-repository'
import type { IFabricRepository } from '../../../contracts/repositories/fabric-repository'
import type { IGarmentRepository } from '../../../contracts/repositories/garment-repository'
import type { ISimulationRepository } from '../../../contracts/repositories/simulation-repository'
import type {
  GenerateImageRequest,
  IImageGenerationProvider,
  ImageInput,
} from '../../../contracts/services/image-generation-provider'
import type { IStorageProvider } from '../../../contracts/storage'
import { canUseCustomerPhoto } from '../../../domain/entities/customer'
import { MAX_SIMULATION_ATTEMPTS, type Simulation } from '../../../domain/entities/simulation'
import { SimulationType } from '../../../domain/enums/simulation'
import { AppError, ValidationError } from '../../../domain/errors/app-error'
import { buildFileKey, IMAGE_EXTENSIONS, StorageFolder } from '../../shared/images'
import { logError } from '../../shared/log'
import { buildFabricSwapPrompt, buildTryOnPrompt } from './prompts'

export interface ProcessSimulationInput {
  simulationId: string
}

export const GENERIC_GENERATION_ERROR = 'Não foi possível gerar a imagem. Tente novamente.'
export const ATTEMPTS_EXHAUSTED_ERROR = 'A geração foi interrompida várias vezes. Crie a simulação novamente.'

/** Executado pela fila. Nunca lança: todo erro vira status FAILED com mensagem. */
export class ProcessSimulationUseCase {
  constructor(
    private readonly simulationRepository: ISimulationRepository,
    private readonly garmentRepository: IGarmentRepository,
    private readonly fabricRepository: IFabricRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly imageProvider: IImageGenerationProvider,
    private readonly storage: IStorageProvider,
  ) {}

  async execute(input: ProcessSimulationInput): Promise<void> {
    const simulation = await this.simulationRepository.claim(input.simulationId)
    if (!simulation) return // já processada ou pega por outra execução

    if (simulation.attempts > MAX_SIMULATION_ATTEMPTS) {
      await this.simulationRepository.markFailed(simulation.id, ATTEMPTS_EXHAUSTED_ERROR)
      return
    }

    try {
      const request = await this.buildRequest(simulation)
      const image = await this.imageProvider.generate(request)

      const mimeType = IMAGE_EXTENSIONS[image.mimeType] ? image.mimeType : 'image/png'
      const resultKey = buildFileKey(StorageFolder.SIMULATIONS, simulation.accountId, mimeType, simulation.id)
      await this.storage.upload({ key: resultKey, buffer: image.buffer, mimeType })

      await this.simulationRepository.markDone(simulation.id, {
        resultKey,
        provider: this.imageProvider.name,
        model: this.imageProvider.model,
      })
    } catch (error) {
      logError('ProcessSimulationUseCase.execute', { simulationId: simulation.id, type: simulation.type }, error)
      const message = error instanceof AppError ? error.message : GENERIC_GENERATION_ERROR
      await this.simulationRepository.markFailed(simulation.id, message)
    }
  }

  private async buildRequest(simulation: Simulation): Promise<GenerateImageRequest> {
    return simulation.type === SimulationType.FABRIC_SWAP
      ? this.buildFabricSwapRequest(simulation)
      : this.buildTryOnRequest(simulation)
  }

  private async buildFabricSwapRequest(simulation: Simulation): Promise<GenerateImageRequest> {
    const [garment, fabric] = await Promise.all([
      simulation.garmentId ? this.garmentRepository.findById(simulation.garmentId) : null,
      simulation.fabricId ? this.fabricRepository.findById(simulation.fabricId) : null,
    ])
    if (!garment || !fabric) throw new ValidationError('A peça ou o tecido desta simulação foi excluído.')

    const images = await Promise.all([this.loadImage(garment.imageKey), this.loadImage(fabric.imageKey)])
    return {
      prompt: buildFabricSwapPrompt({
        fabricType: fabric.fabricType,
        fabricDescription: fabric.description,
        instructions: simulation.instructions,
      }),
      images,
    }
  }

  private async buildTryOnRequest(simulation: Simulation): Promise<GenerateImageRequest> {
    const customer = simulation.customerId ? await this.customerRepository.findById(simulation.customerId) : null
    if (!customer || !canUseCustomerPhoto(customer) || !customer.photoKey) {
      throw new ValidationError('A foto da cliente não está mais disponível.')
    }

    const garmentKey = await this.resolveTryOnGarmentKey(simulation)
    const images = await Promise.all([this.loadImage(customer.photoKey), this.loadImage(garmentKey)])
    return { prompt: buildTryOnPrompt({ instructions: simulation.instructions }), images }
  }

  /** Prioridade: resultado da troca de tecido; senão a foto da peça de referência */
  private async resolveTryOnGarmentKey(simulation: Simulation): Promise<string> {
    if (simulation.sourceSimulationId) {
      const source = await this.simulationRepository.findById(simulation.sourceSimulationId)
      if (source?.resultKey) return source.resultKey
      throw new ValidationError('A simulação de tecido usada como origem foi excluída.')
    }

    const garment = simulation.garmentId ? await this.garmentRepository.findById(simulation.garmentId) : null
    if (!garment) throw new ValidationError('A peça desta simulação foi excluída.')
    return garment.imageKey
  }

  private async loadImage(key: string): Promise<ImageInput> {
    const buffer = await this.storage.download(key)
    const extension = key.split('.').pop() ?? ''
    const mimeType = Object.entries(IMAGE_EXTENSIONS).find(([, ext]) => ext === extension)?.[0] ?? 'image/jpeg'
    return { buffer, mimeType }
  }
}

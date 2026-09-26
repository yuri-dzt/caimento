import type { ICustomerRepository } from '../../../contracts/repositories/customer-repository'
import type { IFabricRepository } from '../../../contracts/repositories/fabric-repository'
import type { IGarmentRepository } from '../../../contracts/repositories/garment-repository'
import type { ISimulationRepository } from '../../../contracts/repositories/simulation-repository'
import type { IImageGenerationProvider } from '../../../contracts/services/image-generation-provider'
import type { IJobQueue } from '../../../contracts/services/job-queue'
import { canUseCustomerPhoto } from '../../../domain/entities/customer'
import type { Simulation } from '../../../domain/entities/simulation'
import { Permission } from '../../../domain/enums/permission'
import { SimulationStatus, SimulationType } from '../../../domain/enums/simulation'
import { NotFoundError, ServiceUnavailableError, ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, requireAccountId } from '../../policies/permissions'
import { optionalText } from '../../shared/text'

export interface CreateSimulationInput {
  actor: AuthUser
  type: SimulationType
  garmentId?: string | null
  fabricId?: string | null
  customerId?: string | null
  /** TRY_ON: troca de tecido já gerada que será vestida na cliente */
  sourceSimulationId?: string | null
  instructions?: string | null
}

interface ResolvedRefs {
  garmentId: string | null
  fabricId: string | null
  customerId: string | null
  sourceSimulationId: string | null
}

export const MAX_INSTRUCTIONS_LENGTH = 1000

/**
 * Cria a simulação como PENDING e enfileira. A geração roda em segundo plano
 * (ProcessSimulationUseCase); o front acompanha por polling.
 *
 * FABRIC_SWAP: peça + tecido.
 * TRY_ON: cliente (com foto e consentimento) + uma fonte: simulação de troca de
 * tecido concluída OU peça de referência como está.
 */
export class CreateSimulationUseCase {
  constructor(
    private readonly simulationRepository: ISimulationRepository,
    private readonly garmentRepository: IGarmentRepository,
    private readonly fabricRepository: IFabricRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly imageProvider: IImageGenerationProvider,
    private readonly jobQueue: IJobQueue,
  ) {}

  async execute(input: CreateSimulationInput): Promise<Simulation> {
    assertPermission(input.actor, Permission.CREATE)
    const accountId = requireAccountId(input.actor)

    if (!this.imageProvider.isConfigured()) {
      throw new ServiceUnavailableError('A geração de imagens não está configurada. Fale com o administrador.')
    }

    const instructions = optionalText(input.instructions)
    if (instructions && instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      throw new ValidationError(`As instruções podem ter no máximo ${MAX_INSTRUCTIONS_LENGTH} caracteres.`)
    }

    const refs =
      input.type === SimulationType.FABRIC_SWAP
        ? await this.resolveFabricSwap(input, accountId)
        : await this.resolveTryOn(input, accountId)

    const simulation = await this.simulationRepository.create({
      accountId,
      createdById: input.actor.id,
      type: input.type,
      instructions,
      ...refs,
    })

    this.jobQueue.enqueue(simulation.id)
    return simulation
  }

  private async resolveFabricSwap(input: CreateSimulationInput, accountId: string): Promise<ResolvedRefs> {
    if (!input.garmentId) throw new ValidationError('Escolha a peça de referência.')
    if (!input.fabricId) throw new ValidationError('Escolha o tecido.')

    const [garment, fabric] = await Promise.all([
      this.garmentRepository.findById(input.garmentId),
      this.fabricRepository.findById(input.fabricId),
    ])
    if (!garment || garment.accountId !== accountId) throw new NotFoundError('Peça não encontrada.')
    if (!fabric || fabric.accountId !== accountId) throw new NotFoundError('Tecido não encontrado.')

    return { garmentId: garment.id, fabricId: fabric.id, customerId: null, sourceSimulationId: null }
  }

  private async resolveTryOn(input: CreateSimulationInput, accountId: string): Promise<ResolvedRefs> {
    if (!input.customerId) throw new ValidationError('Escolha a cliente.')

    const customer = await this.customerRepository.findById(input.customerId)
    if (!customer || customer.accountId !== accountId) throw new NotFoundError('Cliente não encontrada.')
    if (!canUseCustomerPhoto(customer)) {
      throw new ValidationError('A cliente não tem foto com consentimento. Adicione a foto no cadastro dela.')
    }

    if (input.sourceSimulationId) {
      const source = await this.simulationRepository.findById(input.sourceSimulationId)
      if (!source || source.accountId !== accountId) throw new NotFoundError('Simulação de origem não encontrada.')
      if (source.type !== SimulationType.FABRIC_SWAP || source.status !== SimulationStatus.DONE || !source.resultKey) {
        throw new ValidationError('A simulação de origem precisa ser uma troca de tecido concluída.')
      }
      // guarda peça e tecido da origem para o histórico mostrar o que foi provado
      return {
        garmentId: source.garmentId,
        fabricId: source.fabricId,
        customerId: customer.id,
        sourceSimulationId: source.id,
      }
    }

    if (!input.garmentId) throw new ValidationError('Escolha a peça ou uma simulação de tecido para provar.')
    const garment = await this.garmentRepository.findById(input.garmentId)
    if (!garment || garment.accountId !== accountId) throw new NotFoundError('Peça não encontrada.')

    return { garmentId: garment.id, fabricId: null, customerId: customer.id, sourceSimulationId: null }
  }
}

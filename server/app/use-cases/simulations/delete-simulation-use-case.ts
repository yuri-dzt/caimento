import type { ISimulationRepository } from '../../../contracts/repositories/simulation-repository'
import type { IStorageProvider } from '../../../contracts/storage'
import { Permission } from '../../../domain/enums/permission'
import { SimulationStatus } from '../../../domain/enums/simulation'
import { NotFoundError, ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, assertSameAccount } from '../../policies/permissions'
import { deleteFilesSafely } from '../../shared/storage-cleanup'

export interface DeleteSimulationInput {
  actor: AuthUser
  simulationId: string
}

/** Provas de roupa feitas a partir desta simulação continuam (a origem vira null) */
export class DeleteSimulationUseCase {
  constructor(
    private readonly simulationRepository: ISimulationRepository,
    private readonly storage: IStorageProvider,
  ) {}

  async execute(input: DeleteSimulationInput): Promise<void> {
    assertPermission(input.actor, Permission.DELETE)

    const simulation = await this.simulationRepository.findById(input.simulationId)
    if (!simulation) throw new NotFoundError('Simulação não encontrada.')
    assertSameAccount(input.actor, simulation.accountId)

    if (simulation.status === SimulationStatus.PROCESSING) {
      throw new ValidationError('Aguarde a geração terminar para excluir.')
    }

    await deleteFilesSafely(this.storage, [simulation.resultKey])
    await this.simulationRepository.delete(simulation.id)
  }
}

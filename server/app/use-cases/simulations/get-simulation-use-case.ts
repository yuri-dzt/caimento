import type { ISimulationRepository } from '../../../contracts/repositories/simulation-repository'
import type { SimulationDetails } from '../../../domain/entities/simulation-details'
import { Permission } from '../../../domain/enums/permission'
import { NotFoundError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, assertSameAccount } from '../../policies/permissions'

export interface GetSimulationInput {
  actor: AuthUser
  simulationId: string
}

export class GetSimulationUseCase {
  constructor(private readonly simulationRepository: ISimulationRepository) {}

  async execute(input: GetSimulationInput): Promise<SimulationDetails> {
    assertPermission(input.actor, Permission.VIEW)

    const simulation = await this.simulationRepository.findDetailsById(input.simulationId)
    if (!simulation) throw new NotFoundError('Simulação não encontrada.')
    assertSameAccount(input.actor, simulation.accountId)

    return simulation
  }
}

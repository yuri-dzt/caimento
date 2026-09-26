import type { ISimulationRepository } from '../../../contracts/repositories/simulation-repository'
import type { SimulationDetails } from '../../../domain/entities/simulation-details'
import { Permission } from '../../../domain/enums/permission'
import type { SimulationType } from '../../../domain/enums/simulation'
import type { AuthUser } from '../../policies/auth-user'
import { accountScope, assertPermission } from '../../policies/permissions'

export interface ListSimulationsInput {
  actor: AuthUser
  customerId?: string
  type?: SimulationType
  limit?: number
}

export const DEFAULT_SIMULATION_PAGE_SIZE = 60

export class ListSimulationsUseCase {
  constructor(private readonly simulationRepository: ISimulationRepository) {}

  async execute(input: ListSimulationsInput): Promise<SimulationDetails[]> {
    assertPermission(input.actor, Permission.VIEW)
    return this.simulationRepository.list({
      accountId: accountScope(input.actor),
      customerId: input.customerId,
      type: input.type,
      limit: Math.min(input.limit ?? DEFAULT_SIMULATION_PAGE_SIZE, 200),
    })
  }
}

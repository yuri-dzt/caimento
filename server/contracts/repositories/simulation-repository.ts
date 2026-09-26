import type { Simulation } from '../../domain/entities/simulation'
import type { SimulationDetails } from '../../domain/entities/simulation-details'
import type { SimulationStatus, SimulationType } from '../../domain/enums/simulation'

export interface CreateSimulationData {
  accountId: string
  createdById: string
  type: SimulationType
  garmentId: string | null
  fabricId: string | null
  customerId: string | null
  sourceSimulationId: string | null
  instructions: string | null
}

export interface ListSimulationsFilter {
  /** undefined = todas as lojas (admin) */
  accountId?: string
  customerId?: string
  type?: SimulationType
  limit: number
}

export interface CompleteSimulationData {
  resultKey: string
  provider: string
  model: string
}

export interface ISimulationRepository {
  create(data: CreateSimulationData): Promise<Simulation>
  findById(id: string): Promise<Simulation | null>
  findDetailsById(id: string): Promise<SimulationDetails | null>
  list(filter: ListSimulationsFilter): Promise<SimulationDetails[]>
  listByStatus(statuses: SimulationStatus[]): Promise<Simulation[]>
  listByCustomer(customerId: string): Promise<Simulation[]>
  /**
   * Passa de PENDING para PROCESSING de forma atômica e incrementa attempts.
   * Retorna null se outra execução já pegou a simulação.
   */
  claim(id: string): Promise<Simulation | null>
  /** Volta simulações PROCESSING órfãs (reinício do servidor) para PENDING */
  resetProcessing(): Promise<number>
  markDone(id: string, data: CompleteSimulationData): Promise<Simulation>
  markFailed(id: string, errorMessage: string): Promise<Simulation>
  delete(id: string): Promise<void>
  deleteMany(ids: string[]): Promise<void>
}

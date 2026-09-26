import { SimulationStatus, type SimulationType } from '../enums/simulation'

export interface Simulation {
  id: string
  accountId: string
  createdById: string | null
  type: SimulationType
  status: SimulationStatus
  garmentId: string | null
  fabricId: string | null
  customerId: string | null
  sourceSimulationId: string | null
  instructions: string | null
  resultKey: string | null
  errorMessage: string | null
  provider: string | null
  model: string | null
  attempts: number
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export function isSimulationFinished(simulation: Simulation): boolean {
  return simulation.status === SimulationStatus.DONE || simulation.status === SimulationStatus.FAILED
}

/** Máximo de tentativas antes de marcar como falha definitiva (ex.: reinício no meio) */
export const MAX_SIMULATION_ATTEMPTS = 3

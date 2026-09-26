export const SimulationType = {
  FABRIC_SWAP: 'FABRIC_SWAP',
  TRY_ON: 'TRY_ON',
} as const

export type SimulationType = (typeof SimulationType)[keyof typeof SimulationType]

export const SimulationStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const

export type SimulationStatus = (typeof SimulationStatus)[keyof typeof SimulationStatus]

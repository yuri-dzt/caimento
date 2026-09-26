// Tipos das respostas da API (espelham server/infra/http/presenters.ts)

export type AccountType = 'ADMIN' | 'OWNER' | 'EMPLOYEE'
export type Permission = 'view' | 'create' | 'edit' | 'delete'
export type SimulationType = 'FABRIC_SWAP' | 'TRY_ON'
export type SimulationStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'

export const FABRIC_TYPES = [
  'COTTON',
  'LINEN',
  'KNIT',
  'SILK',
  'SATIN',
  'CREPE',
  'CHIFFON',
  'DENIM',
  'LACE',
  'VISCOSE',
  'WOOL',
  'LEATHER',
  'OTHER',
] as const
export type FabricType = (typeof FABRIC_TYPES)[number]

export interface Account {
  id: string
  name: string
  active: boolean
  createdAt: string | null
}

export interface User {
  id: string
  accountId: string | null
  name: string
  email: string
  accountType: AccountType
  permissions: Permission[]
  active: boolean
  createdAt: string | null
}

export interface Me {
  user: User
  account: Account | null
}

export interface Fabric {
  id: string
  accountId: string
  name: string
  fabricType: FabricType
  description: string | null
  imageUrl: string | null
  createdAt: string | null
}

export interface Garment {
  id: string
  accountId: string
  name: string
  description: string | null
  imageUrl: string | null
  createdAt: string | null
}

export interface Customer {
  id: string
  accountId: string
  name: string
  phone: string | null
  notes: string | null
  photoUrl: string | null
  photoConsentAt: string | null
  createdAt: string | null
}

export interface Simulation {
  id: string
  accountId: string
  type: SimulationType
  status: SimulationStatus
  instructions: string | null
  errorMessage: string | null
  resultUrl: string | null
  sourceSimulationId: string | null
  garment: { id: string; name: string; imageUrl: string | null } | null
  fabric: { id: string; name: string; fabricType: FabricType; imageUrl: string | null } | null
  customer: { id: string; name: string } | null
  createdAt: string | null
  completedAt: string | null
}

export function isSimulationRunning(simulation: Pick<Simulation, 'status'>): boolean {
  return simulation.status === 'PENDING' || simulation.status === 'PROCESSING'
}

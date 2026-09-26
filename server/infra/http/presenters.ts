import type { IStorageProvider } from '../../contracts/storage'
import type { Account } from '../../domain/entities/account'
import type { Customer } from '../../domain/entities/customer'
import type { Fabric } from '../../domain/entities/fabric'
import type { Garment } from '../../domain/entities/garment'
import type { SimulationDetails } from '../../domain/entities/simulation-details'
import type { Simulation } from '../../domain/entities/simulation'
import type { PublicUser } from '../../domain/entities/user'
import { toIsoInTz } from '../config/datetime'
import { parseRole } from '../../app/policies/permissions'

// Respostas da API: nunca expõem fileKey, só URL same-origin assinada

export interface AccountResponse {
  id: string
  name: string
  active: boolean
  createdAt: string | null
}

export function presentAccount(account: Account): AccountResponse {
  return { id: account.id, name: account.name, active: account.active, createdAt: toIsoInTz(account.createdAt) }
}

export interface UserResponse {
  id: string
  accountId: string | null
  name: string
  email: string
  accountType: PublicUser['accountType']
  permissions: string[]
  active: boolean
  createdAt: string | null
}

export function presentUser(user: PublicUser): UserResponse {
  return {
    id: user.id,
    accountId: user.accountId,
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    permissions: parseRole(user.role),
    active: user.active,
    createdAt: toIsoInTz(user.createdAt),
  }
}

export interface MeResponse {
  user: UserResponse
  account: AccountResponse | null
}

export function presentMe(user: PublicUser, account: Account | null): MeResponse {
  return { user: presentUser(user), account: account ? presentAccount(account) : null }
}

export function makePresenters(storage: IStorageProvider) {
  const url = (key: string | null): string | null => (key ? storage.fileUrl(key) : null)

  return {
    fabric: (fabric: Fabric) => ({
      id: fabric.id,
      accountId: fabric.accountId,
      name: fabric.name,
      fabricType: fabric.fabricType,
      description: fabric.description,
      imageUrl: url(fabric.imageKey),
      createdAt: toIsoInTz(fabric.createdAt),
    }),

    garment: (garment: Garment) => ({
      id: garment.id,
      accountId: garment.accountId,
      name: garment.name,
      description: garment.description,
      imageUrl: url(garment.imageKey),
      createdAt: toIsoInTz(garment.createdAt),
    }),

    customer: (customer: Customer) => ({
      id: customer.id,
      accountId: customer.accountId,
      name: customer.name,
      phone: customer.phone,
      notes: customer.notes,
      photoUrl: url(customer.photoKey),
      photoConsentAt: toIsoInTz(customer.photoConsentAt),
      createdAt: toIsoInTz(customer.createdAt),
    }),

    simulation: (simulation: Simulation | SimulationDetails) => {
      const details = 'garment' in simulation ? simulation : null
      return {
        id: simulation.id,
        accountId: simulation.accountId,
        type: simulation.type,
        status: simulation.status,
        instructions: simulation.instructions,
        errorMessage: simulation.errorMessage,
        resultUrl: url(simulation.resultKey),
        sourceSimulationId: simulation.sourceSimulationId,
        garment: details?.garment
          ? { id: details.garment.id, name: details.garment.name, imageUrl: url(details.garment.imageKey) }
          : null,
        fabric: details?.fabric
          ? {
              id: details.fabric.id,
              name: details.fabric.name,
              fabricType: details.fabric.fabricType,
              imageUrl: url(details.fabric.imageKey),
            }
          : null,
        customer: details?.customer ?? null,
        createdAt: toIsoInTz(simulation.createdAt),
        completedAt: toIsoInTz(simulation.completedAt),
      }
    },
  }
}

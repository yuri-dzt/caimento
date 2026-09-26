import { vi, type Mocked } from 'vitest'
import type { AuthUser } from '../../server/app/policies/auth-user'
import type { ICustomerRepository } from '../../server/contracts/repositories/customer-repository'
import type { IFabricRepository } from '../../server/contracts/repositories/fabric-repository'
import type { IGarmentRepository } from '../../server/contracts/repositories/garment-repository'
import type { ISimulationRepository } from '../../server/contracts/repositories/simulation-repository'
import type { IUserRepository } from '../../server/contracts/repositories/user-repository'
import type { IAccountRepository } from '../../server/contracts/repositories/account-repository'
import type { IStorageProvider } from '../../server/contracts/storage'
import type { IPasswordHasher } from '../../server/contracts/services/password-hasher'
import type { IImageGenerationProvider } from '../../server/contracts/services/image-generation-provider'
import type { IJobQueue } from '../../server/contracts/services/job-queue'
import type { Account } from '../../server/domain/entities/account'
import type { Customer } from '../../server/domain/entities/customer'
import type { Fabric } from '../../server/domain/entities/fabric'
import type { Garment } from '../../server/domain/entities/garment'
import type { Simulation } from '../../server/domain/entities/simulation'
import type { User } from '../../server/domain/entities/user'

const NOW = new Date('2026-09-26T12:00:00Z')

export const ACCOUNT_ID = 'acc-1'
export const OTHER_ACCOUNT_ID = 'acc-2'

export function makeActor(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-owner',
    email: 'dona@loja.com',
    name: 'Dona',
    accountType: 'OWNER',
    accountId: ACCOUNT_ID,
    accountName: 'Loja',
    role: 'view,create,edit,delete',
    ...overrides,
  }
}

export const adminActor = (): AuthUser =>
  makeActor({ id: 'user-admin', accountType: 'ADMIN', accountId: null, accountName: null })

export const employeeActor = (role = 'view,create'): AuthUser =>
  makeActor({ id: 'user-employee', accountType: 'EMPLOYEE', role })

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return { id: ACCOUNT_ID, name: 'Loja', active: true, createdAt: NOW, updatedAt: NOW, ...overrides }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    accountId: ACCOUNT_ID,
    name: 'Maria',
    email: 'maria@loja.com',
    passwordHash: 'hashed',
    accountType: 'EMPLOYEE',
    role: 'view',
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeGarment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: 'garment-1',
    accountId: ACCOUNT_ID,
    name: 'Vestido midi',
    description: null,
    imageKey: `garments/${ACCOUNT_ID}/g.jpg`,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeFabric(overrides: Partial<Fabric> = {}): Fabric {
  return {
    id: 'fabric-1',
    accountId: ACCOUNT_ID,
    name: 'Linho floral',
    fabricType: 'LINEN',
    description: null,
    imageKey: `fabrics/${ACCOUNT_ID}/f.png`,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'customer-1',
    accountId: ACCOUNT_ID,
    name: 'Ana',
    phone: null,
    notes: null,
    photoKey: `customers/${ACCOUNT_ID}/c.jpg`,
    photoConsentAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function makeSimulation(overrides: Partial<Simulation> = {}): Simulation {
  return {
    id: 'sim-1',
    accountId: ACCOUNT_ID,
    createdById: 'user-owner',
    type: 'FABRIC_SWAP',
    status: 'PENDING',
    garmentId: 'garment-1',
    fabricId: 'fabric-1',
    customerId: null,
    sourceSimulationId: null,
    instructions: null,
    resultKey: null,
    errorMessage: null,
    provider: null,
    model: null,
    attempts: 0,
    startedAt: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export const image = (mimeType = 'image/jpeg') => ({ buffer: Buffer.from('fake-image'), mimeType })

// ---- mocks de contratos ----

export function mockAccountRepository(): Mocked<IAccountRepository> {
  return { create: vi.fn(), findById: vi.fn(), list: vi.fn(), update: vi.fn() }
}

export function mockUserRepository(): Mocked<IUserRepository> {
  return {
    create: vi.fn().mockImplementation(async (data) => makeUser({ ...data, id: 'new-user' })),
    findById: vi.fn(),
    findByEmail: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation(async (id, data) => makeUser({ id, ...data })),
  }
}

export function mockFabricRepository(): Mocked<IFabricRepository> {
  return {
    create: vi.fn().mockImplementation(async (data) => makeFabric({ ...data, id: 'new-fabric' })),
    findById: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
  }
}

export function mockGarmentRepository(): Mocked<IGarmentRepository> {
  return {
    create: vi.fn().mockImplementation(async (data) => makeGarment({ ...data, id: 'new-garment' })),
    findById: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
  }
}

export function mockCustomerRepository(): Mocked<ICustomerRepository> {
  return {
    create: vi.fn().mockImplementation(async (data) => makeCustomer({ ...data, id: 'new-customer' })),
    findById: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation(async (id, data) => makeCustomer({ id, ...data })),
    delete: vi.fn(),
  }
}

export function mockSimulationRepository(): Mocked<ISimulationRepository> {
  return {
    create: vi.fn().mockImplementation(async (data) => makeSimulation({ ...data, id: 'new-sim' })),
    findById: vi.fn(),
    findDetailsById: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    listByStatus: vi.fn().mockResolvedValue([]),
    listByCustomer: vi.fn().mockResolvedValue([]),
    claim: vi.fn(),
    resetProcessing: vi.fn().mockResolvedValue(0),
    markDone: vi.fn(),
    markFailed: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  }
}

export function mockStorage(): Mocked<IStorageProvider> {
  return {
    isConfigured: vi.fn().mockReturnValue(true),
    upload: vi.fn().mockResolvedValue(undefined),
    download: vi.fn().mockResolvedValue(Buffer.from('stored')),
    getObject: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    fileUrl: vi.fn((key: string) => `/api/files/${key}`),
  }
}

export function mockPasswordHasher(): Mocked<IPasswordHasher> {
  return {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    verify: vi.fn().mockResolvedValue(true),
  }
}

export function mockImageProvider(configured = true): Mocked<IImageGenerationProvider> {
  return {
    name: 'fake',
    model: 'fake-model',
    isConfigured: vi.fn().mockReturnValue(configured),
    generate: vi.fn().mockResolvedValue({ buffer: Buffer.from('generated'), mimeType: 'image/png' }),
  }
}

export function mockJobQueue(): Mocked<IJobQueue> {
  return { enqueue: vi.fn() }
}

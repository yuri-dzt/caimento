import type { Customer } from '../../domain/entities/customer'
import type { ListByAccountFilter } from './fabric-repository'

export interface CreateCustomerData {
  accountId: string
  name: string
  phone: string | null
  notes: string | null
  photoKey: string | null
  photoConsentAt: Date | null
}

export interface UpdateCustomerData {
  name?: string
  phone?: string | null
  notes?: string | null
  photoKey?: string | null
  photoConsentAt?: Date | null
}

export interface ICustomerRepository {
  create(data: CreateCustomerData): Promise<Customer>
  findById(id: string): Promise<Customer | null>
  list(filter: ListByAccountFilter): Promise<Customer[]>
  update(id: string, data: UpdateCustomerData): Promise<Customer>
  delete(id: string): Promise<void>
}

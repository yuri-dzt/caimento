import type { Account } from '../../domain/entities/account'

export interface CreateAccountData {
  name: string
}

export interface UpdateAccountData {
  name?: string
  active?: boolean
}

export interface IAccountRepository {
  create(data: CreateAccountData): Promise<Account>
  findById(id: string): Promise<Account | null>
  list(): Promise<Account[]>
  update(id: string, data: UpdateAccountData): Promise<Account>
}

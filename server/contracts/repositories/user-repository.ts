import type { User } from '../../domain/entities/user'
import type { AccountType } from '../../domain/enums/account-type'

export interface CreateUserData {
  accountId: string | null
  name: string
  email: string
  passwordHash: string
  accountType: AccountType
  role: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  passwordHash?: string
  role?: string
  active?: boolean
}

export interface ListUsersFilter {
  /** undefined = todas as lojas (admin) */
  accountId?: string
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  list(filter: ListUsersFilter): Promise<User[]>
  update(id: string, data: UpdateUserData): Promise<User>
}

import type { AccountType } from '../enums/account-type'

export interface User {
  id: string
  accountId: string | null
  name: string
  email: string
  passwordHash: string
  accountType: AccountType
  role: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

/** Usuário sem dados sensíveis, seguro para sair na API */
export type PublicUser = Omit<User, 'passwordHash'>

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user
  return rest
}

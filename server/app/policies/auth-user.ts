import type { AccountType } from '../../domain/enums/account-type'

/** Usuário autenticado, montado a partir do JWT (request.user) */
export interface AuthUser {
  id: string
  email: string
  name: string
  accountType: AccountType
  accountId: string | null
  accountName: string | null
  /** CSV de view,create,edit,delete */
  role: string
}

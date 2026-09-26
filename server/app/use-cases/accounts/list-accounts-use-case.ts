import type { IAccountRepository } from '../../../contracts/repositories/account-repository'
import type { Account } from '../../../domain/entities/account'
import type { AuthUser } from '../../policies/auth-user'
import { assertPlatformAdmin } from '../../policies/permissions'

export interface ListAccountsInput {
  actor: AuthUser
}

export class ListAccountsUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(input: ListAccountsInput): Promise<Account[]> {
    assertPlatformAdmin(input.actor)
    return this.accountRepository.list()
  }
}

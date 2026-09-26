import type { IAccountRepository } from '../../../contracts/repositories/account-repository'
import type { Account } from '../../../domain/entities/account'
import { NotFoundError, ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPlatformAdmin } from '../../policies/permissions'

export interface UpdateAccountInput {
  actor: AuthUser
  accountId: string
  name?: string
  active?: boolean
}

export class UpdateAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(input: UpdateAccountInput): Promise<Account> {
    assertPlatformAdmin(input.actor)

    const account = await this.accountRepository.findById(input.accountId)
    if (!account) throw new NotFoundError('Loja não encontrada.')

    const name = input.name?.trim()
    if (input.name !== undefined && !name) throw new ValidationError('Informe o nome da loja.')

    return this.accountRepository.update(account.id, { name, active: input.active })
  }
}

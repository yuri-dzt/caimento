import type { IUserRepository } from '../../../contracts/repositories/user-repository'
import { toPublicUser, type PublicUser } from '../../../domain/entities/user'
import { AccountType } from '../../../domain/enums/account-type'
import { ForbiddenError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { isPlatformAdmin } from '../../policies/permissions'

export interface ListUsersInput {
  actor: AuthUser
  /** Filtro opcional do admin */
  accountId?: string
}

export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ListUsersInput): Promise<PublicUser[]> {
    const { actor } = input

    let accountId: string | undefined
    if (isPlatformAdmin(actor)) {
      accountId = input.accountId
    } else if (actor.accountType === AccountType.OWNER && actor.accountId) {
      accountId = actor.accountId
    } else {
      throw new ForbiddenError()
    }

    const users = await this.userRepository.list({ accountId })
    return users.map(toPublicUser)
  }
}

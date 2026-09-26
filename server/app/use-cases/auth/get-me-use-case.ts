import type { IAccountRepository } from '../../../contracts/repositories/account-repository'
import type { IUserRepository } from '../../../contracts/repositories/user-repository'
import type { Account } from '../../../domain/entities/account'
import { toPublicUser, type PublicUser } from '../../../domain/entities/user'
import { UnauthorizedError } from '../../../domain/errors/app-error'

export interface GetMeInput {
  userId: string
}

export interface GetMeOutput {
  user: PublicUser
  account: Account | null
}

/** Relê usuário e loja do banco: usuário ou loja desativados perdem a sessão */
export class GetMeUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(input: GetMeInput): Promise<GetMeOutput> {
    const user = await this.userRepository.findById(input.userId)
    if (!user || !user.active) throw new UnauthorizedError()

    let account: Account | null = null
    if (user.accountId) {
      account = await this.accountRepository.findById(user.accountId)
      if (!account || !account.active) throw new UnauthorizedError()
    }

    return { user: toPublicUser(user), account }
  }
}

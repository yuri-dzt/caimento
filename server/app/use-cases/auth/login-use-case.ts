import type { IAccountRepository } from '../../../contracts/repositories/account-repository'
import type { IUserRepository } from '../../../contracts/repositories/user-repository'
import type { IPasswordHasher } from '../../../contracts/services/password-hasher'
import type { Account } from '../../../domain/entities/account'
import { toPublicUser, type PublicUser } from '../../../domain/entities/user'
import { UnauthorizedError } from '../../../domain/errors/app-error'
import { normalizeEmail } from '../../shared/text'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginOutput {
  user: PublicUser
  account: Account | null
}

const INVALID_CREDENTIALS = 'E-mail ou senha inválidos.'

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(normalizeEmail(input.email))

    if (!user) {
      // gasta o mesmo tempo de um hash para não revelar se o e-mail existe
      await this.passwordHasher.hash(input.password)
      throw new UnauthorizedError(INVALID_CREDENTIALS)
    }

    const passwordMatches = await this.passwordHasher.verify(input.password, user.passwordHash)
    if (!passwordMatches || !user.active) throw new UnauthorizedError(INVALID_CREDENTIALS)

    let account: Account | null = null
    if (user.accountId) {
      account = await this.accountRepository.findById(user.accountId)
      if (!account || !account.active) throw new UnauthorizedError(INVALID_CREDENTIALS)
    }

    return { user: toPublicUser(user), account }
  }
}

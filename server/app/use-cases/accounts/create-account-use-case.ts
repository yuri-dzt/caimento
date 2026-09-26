import type { IAccountRepository } from '../../../contracts/repositories/account-repository'
import type { IUserRepository } from '../../../contracts/repositories/user-repository'
import type { IPasswordHasher } from '../../../contracts/services/password-hasher'
import type { Account } from '../../../domain/entities/account'
import { toPublicUser, type PublicUser } from '../../../domain/entities/user'
import { AccountType } from '../../../domain/enums/account-type'
import { ALL_PERMISSIONS } from '../../../domain/enums/permission'
import { ConflictError, ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPlatformAdmin, serializeRole } from '../../policies/permissions'
import { MIN_PASSWORD_LENGTH, normalizeEmail } from '../../shared/text'

export interface CreateAccountInput {
  actor: AuthUser
  name: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
}

export interface CreateAccountOutput {
  account: Account
  owner: PublicUser
}

/** Admin cria a loja já com a dona (acesso total dentro da loja) */
export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    assertPlatformAdmin(input.actor)

    const name = input.name.trim()
    const ownerName = input.ownerName.trim()
    const ownerEmail = normalizeEmail(input.ownerEmail)
    if (!name) throw new ValidationError('Informe o nome da loja.')
    if (!ownerName) throw new ValidationError('Informe o nome da responsável.')
    if (input.ownerPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    }

    // checa antes de criar a loja para não deixar loja sem dona
    if (await this.userRepository.findByEmail(ownerEmail)) {
      throw new ConflictError('Já existe um usuário com este e-mail.')
    }

    const account = await this.accountRepository.create({ name })
    const owner = await this.userRepository.create({
      accountId: account.id,
      name: ownerName,
      email: ownerEmail,
      passwordHash: await this.passwordHasher.hash(input.ownerPassword),
      accountType: AccountType.OWNER,
      role: serializeRole(ALL_PERMISSIONS),
    })

    return { account, owner: toPublicUser(owner) }
  }
}

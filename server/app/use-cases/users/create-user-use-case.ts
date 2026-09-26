import type { IAccountRepository } from '../../../contracts/repositories/account-repository'
import type { IUserRepository } from '../../../contracts/repositories/user-repository'
import type { IPasswordHasher } from '../../../contracts/services/password-hasher'
import { toPublicUser, type PublicUser } from '../../../domain/entities/user'
import { AccountType } from '../../../domain/enums/account-type'
import { ALL_PERMISSIONS, type Permission } from '../../../domain/enums/permission'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { isPlatformAdmin, serializeRole } from '../../policies/permissions'
import { MIN_PASSWORD_LENGTH, normalizeEmail } from '../../shared/text'

export interface CreateUserInput {
  actor: AuthUser
  name: string
  email: string
  password: string
  accountType: AccountType
  permissions: Permission[]
  /** Só admin informa; dona usa sempre a própria loja */
  accountId?: string | null
}

/**
 * Regras:
 * - admin: cria ADMIN (sem loja), OWNER ou EMPLOYEE em qualquer loja existente
 * - owner: cria só EMPLOYEE na própria loja
 * - employee: não cria usuário
 * - OWNER e ADMIN sempre têm todas as permissões
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<PublicUser> {
    const accountId = this.resolveAccountId(input)

    const name = input.name.trim()
    const email = normalizeEmail(input.email)
    if (!name) throw new ValidationError('Informe o nome.')
    if (!email) throw new ValidationError('Informe o e-mail.')
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    }

    if (accountId) {
      const account = await this.accountRepository.findById(accountId)
      if (!account) throw new NotFoundError('Loja não encontrada.')
    }

    if (await this.userRepository.findByEmail(email)) {
      throw new ConflictError('Já existe um usuário com este e-mail.')
    }

    const permissions = input.accountType === AccountType.EMPLOYEE ? input.permissions : ALL_PERMISSIONS
    const user = await this.userRepository.create({
      accountId,
      name,
      email,
      passwordHash: await this.passwordHasher.hash(input.password),
      accountType: input.accountType,
      role: serializeRole(permissions),
    })

    return toPublicUser(user)
  }

  private resolveAccountId(input: CreateUserInput): string | null {
    const { actor, accountType } = input

    if (isPlatformAdmin(actor)) {
      if (accountType === AccountType.ADMIN) return null
      if (!input.accountId) throw new ValidationError('Selecione a loja do usuário.')
      return input.accountId
    }

    if (actor.accountType !== AccountType.OWNER || !actor.accountId) throw new ForbiddenError()
    if (accountType !== AccountType.EMPLOYEE) {
      throw new ForbiddenError('A responsável da loja só pode cadastrar funcionárias.')
    }
    return actor.accountId
  }
}

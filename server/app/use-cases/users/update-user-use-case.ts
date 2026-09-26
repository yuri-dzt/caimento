import type { IUserRepository, UpdateUserData } from '../../../contracts/repositories/user-repository'
import type { IPasswordHasher } from '../../../contracts/services/password-hasher'
import { toPublicUser, type PublicUser, type User } from '../../../domain/entities/user'
import { AccountType } from '../../../domain/enums/account-type'
import type { Permission } from '../../../domain/enums/permission'
import { ForbiddenError, NotFoundError, ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { isPlatformAdmin, serializeRole } from '../../policies/permissions'
import { MIN_PASSWORD_LENGTH } from '../../shared/text'

export interface UpdateUserInput {
  actor: AuthUser
  userId: string
  name?: string
  permissions?: Permission[]
  active?: boolean
  /** Redefinição de senha feita pela dona/admin */
  password?: string
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: UpdateUserInput): Promise<PublicUser> {
    const { actor } = input
    const target = await this.userRepository.findById(input.userId)
    if (!target) throw new NotFoundError('Usuário não encontrado.')

    this.assertCanManage(actor, target)

    if (input.active === false && target.id === actor.id) {
      throw new ValidationError('Você não pode desativar o próprio usuário.')
    }

    const data: UpdateUserData = {}

    if (input.name !== undefined) {
      const name = input.name.trim()
      if (!name) throw new ValidationError('Informe o nome.')
      data.name = name
    }

    // dona e admin sempre têm acesso total: permissões só mudam para funcionária
    if (input.permissions !== undefined && target.accountType === AccountType.EMPLOYEE) {
      data.role = serializeRole(input.permissions)
    }

    if (input.active !== undefined) data.active = input.active

    if (input.password !== undefined) {
      if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new ValidationError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      }
      data.passwordHash = await this.passwordHasher.hash(input.password)
    }

    const updated = await this.userRepository.update(target.id, data)
    return toPublicUser(updated)
  }

  private assertCanManage(actor: AuthUser, target: User): void {
    if (isPlatformAdmin(actor)) return

    if (actor.accountType !== AccountType.OWNER) throw new ForbiddenError()
    // outra loja: 404 para não revelar que existe
    if (target.accountId !== actor.accountId) throw new NotFoundError('Usuário não encontrado.')
    if (target.accountType !== AccountType.EMPLOYEE) {
      throw new ForbiddenError('A responsável da loja só pode alterar funcionárias.')
    }
  }
}

import type { IUserRepository } from '../../../contracts/repositories/user-repository'
import type { IPasswordHasher } from '../../../contracts/services/password-hasher'
import { UnauthorizedError, ValidationError } from '../../../domain/errors/app-error'
import { MIN_PASSWORD_LENGTH } from '../../shared/text'

export interface ChangePasswordInput {
  userId: string
  currentPassword: string
  newPassword: string
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    }

    const user = await this.userRepository.findById(input.userId)
    if (!user || !user.active) throw new UnauthorizedError()

    const matches = await this.passwordHasher.verify(input.currentPassword, user.passwordHash)
    if (!matches) throw new ValidationError('Senha atual incorreta.')

    const passwordHash = await this.passwordHasher.hash(input.newPassword)
    await this.userRepository.update(user.id, { passwordHash })
  }
}

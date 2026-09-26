import { ChangePasswordUseCase } from '../../server/app/use-cases/auth/change-password-use-case'
import { GetMeUseCase } from '../../server/app/use-cases/auth/get-me-use-case'
import { LoginUseCase } from '../../server/app/use-cases/auth/login-use-case'
import { UnauthorizedError, ValidationError } from '../../server/domain/errors/app-error'
import {
  makeAccount,
  makeUser,
  mockAccountRepository,
  mockPasswordHasher,
  mockUserRepository,
} from '../helpers/factories'

function makeDeps() {
  const userRepository = mockUserRepository()
  const accountRepository = mockAccountRepository()
  const passwordHasher = mockPasswordHasher()
  accountRepository.findById.mockResolvedValue(makeAccount())
  return { userRepository, accountRepository, passwordHasher }
}

describe('LoginUseCase', () => {
  it('normaliza o e-mail e devolve usuário sem hash de senha', async () => {
    const deps = makeDeps()
    deps.userRepository.findByEmail.mockResolvedValue(makeUser())
    const useCase = new LoginUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    const result = await useCase.execute({ email: '  MARIA@Loja.com ', password: 'secret123' })

    expect(deps.userRepository.findByEmail).toHaveBeenCalledWith('maria@loja.com')
    expect(result.user).not.toHaveProperty('passwordHash')
    expect(result.account?.id).toBe('acc-1')
  })

  it('e-mail inexistente: erro genérico e ainda calcula hash (tempo constante)', async () => {
    const deps = makeDeps()
    const useCase = new LoginUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(useCase.execute({ email: 'x@x.com', password: 'a' })).rejects.toThrow('E-mail ou senha inválidos.')
    expect(deps.passwordHasher.hash).toHaveBeenCalled()
  })

  it('senha errada: mesmo erro genérico', async () => {
    const deps = makeDeps()
    deps.userRepository.findByEmail.mockResolvedValue(makeUser())
    deps.passwordHasher.verify.mockResolvedValue(false)
    const useCase = new LoginUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(useCase.execute({ email: 'maria@loja.com', password: 'x' })).rejects.toThrow('E-mail ou senha inválidos.')
  })

  it('bloqueia usuário inativo', async () => {
    const deps = makeDeps()
    deps.userRepository.findByEmail.mockResolvedValue(makeUser({ active: false }))
    const useCase = new LoginUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(useCase.execute({ email: 'maria@loja.com', password: 'x' })).rejects.toThrow(UnauthorizedError)
  })

  it('bloqueia usuário de loja inativa', async () => {
    const deps = makeDeps()
    deps.userRepository.findByEmail.mockResolvedValue(makeUser())
    deps.accountRepository.findById.mockResolvedValue(makeAccount({ active: false }))
    const useCase = new LoginUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(useCase.execute({ email: 'maria@loja.com', password: 'x' })).rejects.toThrow(UnauthorizedError)
  })

  it('admin da plataforma entra sem loja', async () => {
    const deps = makeDeps()
    deps.userRepository.findByEmail.mockResolvedValue(makeUser({ accountType: 'ADMIN', accountId: null }))
    const useCase = new LoginUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    const result = await useCase.execute({ email: 'admin@x.com', password: 'x' })
    expect(result.account).toBeNull()
    expect(deps.accountRepository.findById).not.toHaveBeenCalled()
  })
})

describe('GetMeUseCase', () => {
  it('derruba a sessão de usuário desativado depois do login', async () => {
    const deps = makeDeps()
    deps.userRepository.findById.mockResolvedValue(makeUser({ active: false }))
    const useCase = new GetMeUseCase(deps.userRepository, deps.accountRepository)

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(UnauthorizedError)
  })
})

describe('ChangePasswordUseCase', () => {
  it('exige senha nova com 8+ caracteres', async () => {
    const deps = makeDeps()
    const useCase = new ChangePasswordUseCase(deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ userId: 'user-1', currentPassword: 'old', newPassword: '123' }),
    ).rejects.toThrow(ValidationError)
  })

  it('rejeita senha atual incorreta', async () => {
    const deps = makeDeps()
    deps.userRepository.findById.mockResolvedValue(makeUser())
    deps.passwordHasher.verify.mockResolvedValue(false)
    const useCase = new ChangePasswordUseCase(deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ userId: 'user-1', currentPassword: 'wrong', newPassword: 'nova-senha-123' }),
    ).rejects.toThrow('Senha atual incorreta.')
    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })

  it('grava o novo hash', async () => {
    const deps = makeDeps()
    deps.userRepository.findById.mockResolvedValue(makeUser())
    const useCase = new ChangePasswordUseCase(deps.userRepository, deps.passwordHasher)

    await useCase.execute({ userId: 'user-1', currentPassword: 'old', newPassword: 'nova-senha-123' })
    expect(deps.userRepository.update).toHaveBeenCalledWith('user-1', { passwordHash: 'hashed-password' })
  })
})

import { CreateAccountUseCase } from '../../server/app/use-cases/accounts/create-account-use-case'
import { CreateUserUseCase } from '../../server/app/use-cases/users/create-user-use-case'
import { ListUsersUseCase } from '../../server/app/use-cases/users/list-users-use-case'
import { UpdateUserUseCase } from '../../server/app/use-cases/users/update-user-use-case'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../server/domain/errors/app-error'
import {
  adminActor,
  employeeActor,
  makeAccount,
  makeActor,
  makeUser,
  mockAccountRepository,
  mockPasswordHasher,
  mockUserRepository,
  OTHER_ACCOUNT_ID,
} from '../helpers/factories'

function makeDeps() {
  const userRepository = mockUserRepository()
  const accountRepository = mockAccountRepository()
  const passwordHasher = mockPasswordHasher()
  accountRepository.findById.mockResolvedValue(makeAccount())
  accountRepository.create.mockResolvedValue(makeAccount({ id: 'new-acc' }))
  return { userRepository, accountRepository, passwordHasher }
}

const baseInput = { name: 'Joana', email: 'joana@loja.com', password: 'senha-forte-1' }

describe('CreateUserUseCase', () => {
  it('dona cria funcionária na própria loja, com view sempre incluído', async () => {
    const deps = makeDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await useCase.execute({
      actor: makeActor(),
      ...baseInput,
      accountType: 'EMPLOYEE',
      permissions: ['create'],
      accountId: OTHER_ACCOUNT_ID, // ignorado para dona
    })

    expect(deps.userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: 'acc-1', role: 'view,create', accountType: 'EMPLOYEE' }),
    )
  })

  it('dona não cria outra dona', async () => {
    const deps = makeDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ actor: makeActor(), ...baseInput, accountType: 'OWNER', permissions: [] }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('funcionária não cria usuário', async () => {
    const deps = makeDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ actor: employeeActor(), ...baseInput, accountType: 'EMPLOYEE', permissions: [] }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('admin precisa informar a loja para dona/funcionária', async () => {
    const deps = makeDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ actor: adminActor(), ...baseInput, accountType: 'OWNER', permissions: [] }),
    ).rejects.toThrow(ValidationError)
  })

  it('dona sempre recebe todas as permissões', async () => {
    const deps = makeDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await useCase.execute({ actor: adminActor(), ...baseInput, accountType: 'OWNER', permissions: [], accountId: 'acc-1' })
    expect(deps.userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'view,create,edit,delete' }),
    )
  })

  it('e-mail duplicado dá conflito', async () => {
    const deps = makeDeps()
    deps.userRepository.findByEmail.mockResolvedValue(makeUser())
    const useCase = new CreateUserUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ actor: makeActor(), ...baseInput, accountType: 'EMPLOYEE', permissions: [] }),
    ).rejects.toThrow(ConflictError)
  })

  it('senha curta é rejeitada', async () => {
    const deps = makeDeps()
    const useCase = new CreateUserUseCase(deps.userRepository, deps.accountRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ actor: makeActor(), ...baseInput, password: '123', accountType: 'EMPLOYEE', permissions: [] }),
    ).rejects.toThrow(ValidationError)
  })
})

describe('UpdateUserUseCase', () => {
  it('dona não altera usuário de outra loja (404)', async () => {
    const deps = makeDeps()
    deps.userRepository.findById.mockResolvedValue(makeUser({ accountId: OTHER_ACCOUNT_ID }))
    const useCase = new UpdateUserUseCase(deps.userRepository, deps.passwordHasher)

    await expect(useCase.execute({ actor: makeActor(), userId: 'user-1', name: 'X' })).rejects.toThrow(NotFoundError)
  })

  it('ninguém desativa o próprio usuário', async () => {
    const deps = makeDeps()
    deps.userRepository.findById.mockResolvedValue(makeUser({ id: 'user-admin', accountType: 'ADMIN', accountId: null }))
    const useCase = new UpdateUserUseCase(deps.userRepository, deps.passwordHasher)

    await expect(useCase.execute({ actor: adminActor(), userId: 'user-admin', active: false })).rejects.toThrow(
      ValidationError,
    )
  })

  it('permissões só mudam para funcionária', async () => {
    const deps = makeDeps()
    deps.userRepository.findById.mockResolvedValue(makeUser({ accountType: 'OWNER' }))
    const useCase = new UpdateUserUseCase(deps.userRepository, deps.passwordHasher)

    await useCase.execute({ actor: adminActor(), userId: 'user-1', permissions: [] })
    expect(deps.userRepository.update).toHaveBeenCalledWith('user-1', {})
  })

  it('redefinição de senha grava hash', async () => {
    const deps = makeDeps()
    deps.userRepository.findById.mockResolvedValue(makeUser())
    const useCase = new UpdateUserUseCase(deps.userRepository, deps.passwordHasher)

    await useCase.execute({ actor: makeActor(), userId: 'user-1', password: 'nova-senha-1' })
    expect(deps.userRepository.update).toHaveBeenCalledWith('user-1', { passwordHash: 'hashed-password' })
  })
})

describe('ListUsersUseCase', () => {
  it('dona lista só a própria loja; funcionária é bloqueada', async () => {
    const deps = makeDeps()
    const useCase = new ListUsersUseCase(deps.userRepository)

    await useCase.execute({ actor: makeActor(), accountId: OTHER_ACCOUNT_ID })
    expect(deps.userRepository.list).toHaveBeenCalledWith({ accountId: 'acc-1' })
    await expect(useCase.execute({ actor: employeeActor() })).rejects.toThrow(ForbiddenError)
  })
})

describe('CreateAccountUseCase', () => {
  it('só admin cria loja', async () => {
    const deps = makeDeps()
    const useCase = new CreateAccountUseCase(deps.accountRepository, deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ actor: makeActor(), name: 'L', ownerName: 'D', ownerEmail: 'd@d.com', ownerPassword: '12345678' }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('não cria loja se o e-mail da dona já existe', async () => {
    const deps = makeDeps()
    deps.userRepository.findByEmail.mockResolvedValue(makeUser())
    const useCase = new CreateAccountUseCase(deps.accountRepository, deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ actor: adminActor(), name: 'L', ownerName: 'D', ownerEmail: 'd@d.com', ownerPassword: '12345678' }),
    ).rejects.toThrow(ConflictError)
    expect(deps.accountRepository.create).not.toHaveBeenCalled()
  })

  it('cria loja + dona com acesso total', async () => {
    const deps = makeDeps()
    const useCase = new CreateAccountUseCase(deps.accountRepository, deps.userRepository, deps.passwordHasher)

    await useCase.execute({
      actor: adminActor(),
      name: 'Ateliê Flor',
      ownerName: 'Rosa',
      ownerEmail: 'Rosa@Atelie.com',
      ownerPassword: '12345678',
    })
    expect(deps.userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'new-acc',
        email: 'rosa@atelie.com',
        accountType: 'OWNER',
        role: 'view,create,edit,delete',
      }),
    )
  })
})

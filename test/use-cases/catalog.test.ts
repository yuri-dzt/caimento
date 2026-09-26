import { CreateCustomerUseCase } from '../../server/app/use-cases/customers/create-customer-use-case'
import { DeleteCustomerUseCase } from '../../server/app/use-cases/customers/delete-customer-use-case'
import { UpdateCustomerPhotoUseCase } from '../../server/app/use-cases/customers/update-customer-photo-use-case'
import { CreateFabricUseCase } from '../../server/app/use-cases/fabrics/create-fabric-use-case'
import { DeleteFabricUseCase } from '../../server/app/use-cases/fabrics/delete-fabric-use-case'
import { ListFabricsUseCase } from '../../server/app/use-cases/fabrics/list-fabrics-use-case'
import { ForbiddenError, NotFoundError, ValidationError } from '../../server/domain/errors/app-error'
import {
  adminActor,
  employeeActor,
  image,
  makeActor,
  makeCustomer,
  makeFabric,
  makeSimulation,
  mockCustomerRepository,
  mockFabricRepository,
  mockSimulationRepository,
  mockStorage,
  OTHER_ACCOUNT_ID,
} from '../helpers/factories'

function makeDeps() {
  return {
    fabricRepository: mockFabricRepository(),
    customerRepository: mockCustomerRepository(),
    simulationRepository: mockSimulationRepository(),
    storage: mockStorage(),
  }
}

describe('CreateFabricUseCase', () => {
  it('sobe a imagem na pasta da loja e grava o fileKey', async () => {
    const deps = makeDeps()
    const useCase = new CreateFabricUseCase(deps.fabricRepository, deps.storage)

    await useCase.execute({ actor: makeActor(), name: ' Linho ', fabricType: 'LINEN', image: image('image/png') })

    const key = deps.storage.upload.mock.calls[0][0].key
    expect(key).toMatch(/^fabrics\/acc-1\/[0-9a-f-]+\.png$/)
    expect(deps.fabricRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Linho', imageKey: key, description: null }),
    )
  })

  it('rejeita formato de imagem não suportado', async () => {
    const deps = makeDeps()
    const useCase = new CreateFabricUseCase(deps.fabricRepository, deps.storage)

    await expect(
      useCase.execute({ actor: makeActor(), name: 'X', fabricType: 'LINEN', image: image('image/gif') }),
    ).rejects.toThrow(ValidationError)
    expect(deps.storage.upload).not.toHaveBeenCalled()
  })

  it('apaga o arquivo se o banco falhar', async () => {
    const deps = makeDeps()
    deps.fabricRepository.create.mockRejectedValue(new Error('db down'))
    const useCase = new CreateFabricUseCase(deps.fabricRepository, deps.storage)

    await expect(
      useCase.execute({ actor: makeActor(), name: 'X', fabricType: 'LINEN', image: image() }),
    ).rejects.toThrow('db down')
    expect(deps.storage.delete).toHaveBeenCalledWith(deps.storage.upload.mock.calls[0][0].key)
  })

  it('funcionária sem create é bloqueada', async () => {
    const deps = makeDeps()
    const useCase = new CreateFabricUseCase(deps.fabricRepository, deps.storage)

    await expect(
      useCase.execute({ actor: employeeActor('view'), name: 'X', fabricType: 'LINEN', image: image() }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('admin sem loja não cadastra tecido', async () => {
    const deps = makeDeps()
    const useCase = new CreateFabricUseCase(deps.fabricRepository, deps.storage)

    await expect(
      useCase.execute({ actor: adminActor(), name: 'X', fabricType: 'LINEN', image: image() }),
    ).rejects.toThrow(ForbiddenError)
  })
})

describe('ListFabricsUseCase', () => {
  it('filtra pela loja do usuário', async () => {
    const deps = makeDeps()
    await new ListFabricsUseCase(deps.fabricRepository).execute({ actor: makeActor() })
    expect(deps.fabricRepository.list).toHaveBeenCalledWith({ accountId: 'acc-1' })
  })
})

describe('DeleteFabricUseCase', () => {
  it('tecido de outra loja responde 404 e não apaga nada', async () => {
    const deps = makeDeps()
    deps.fabricRepository.findById.mockResolvedValue(makeFabric({ accountId: OTHER_ACCOUNT_ID }))
    const useCase = new DeleteFabricUseCase(deps.fabricRepository, deps.storage)

    await expect(useCase.execute({ actor: makeActor(), fabricId: 'fabric-1' })).rejects.toThrow(NotFoundError)
    expect(deps.storage.delete).not.toHaveBeenCalled()
    expect(deps.fabricRepository.delete).not.toHaveBeenCalled()
  })

  it('apaga storage antes do banco e segue mesmo se o storage falhar', async () => {
    const deps = makeDeps()
    const order: string[] = []
    deps.fabricRepository.findById.mockResolvedValue(makeFabric())
    deps.storage.delete.mockImplementation(async () => {
      order.push('storage')
      throw new Error('minio off')
    })
    deps.fabricRepository.delete.mockImplementation(async () => {
      order.push('db')
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await new DeleteFabricUseCase(deps.fabricRepository, deps.storage).execute({
      actor: makeActor(),
      fabricId: 'fabric-1',
    })
    expect(order).toEqual(['storage', 'db'])
  })
})

describe('CreateCustomerUseCase', () => {
  const now = new Date('2026-09-26T15:00:00Z')

  it('foto sem consentimento é rejeitada (LGPD)', async () => {
    const deps = makeDeps()
    const useCase = new CreateCustomerUseCase(deps.customerRepository, deps.storage, () => now)

    await expect(
      useCase.execute({ actor: makeActor(), name: 'Ana', photo: image(), photoConsent: false }),
    ).rejects.toThrow('consentimento')
    expect(deps.storage.upload).not.toHaveBeenCalled()
  })

  it('com consentimento grava a data do aceite', async () => {
    const deps = makeDeps()
    const useCase = new CreateCustomerUseCase(deps.customerRepository, deps.storage, () => now)

    await useCase.execute({ actor: makeActor(), name: 'Ana', photo: image(), photoConsent: true })
    expect(deps.customerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ photoConsentAt: now, photoKey: expect.stringMatching(/^customers\/acc-1\//) }),
    )
  })

  it('sem foto não registra consentimento', async () => {
    const deps = makeDeps()
    const useCase = new CreateCustomerUseCase(deps.customerRepository, deps.storage, () => now)

    await useCase.execute({ actor: makeActor(), name: 'Ana', photoConsent: true })
    expect(deps.customerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ photoKey: null, photoConsentAt: null }),
    )
  })
})

describe('UpdateCustomerPhotoUseCase', () => {
  it('troca a foto e apaga a anterior', async () => {
    const deps = makeDeps()
    deps.customerRepository.findById.mockResolvedValue(makeCustomer({ photoKey: 'customers/acc-1/old.jpg' }))
    const useCase = new UpdateCustomerPhotoUseCase(deps.customerRepository, deps.storage)

    await useCase.execute({ actor: makeActor(), customerId: 'customer-1', photo: image(), photoConsent: true })
    expect(deps.storage.delete).toHaveBeenCalledWith('customers/acc-1/old.jpg')
  })
})

describe('DeleteCustomerUseCase', () => {
  it('apaga foto e provas de roupa da cliente, mantém trocas de tecido', async () => {
    const deps = makeDeps()
    deps.customerRepository.findById.mockResolvedValue(makeCustomer())
    deps.simulationRepository.listByCustomer.mockResolvedValue([
      makeSimulation({ id: 'try-1', type: 'TRY_ON', customerId: 'customer-1', resultKey: 'simulations/acc-1/try-1.png' }),
      makeSimulation({ id: 'swap-1', type: 'FABRIC_SWAP', customerId: 'customer-1', resultKey: 'simulations/acc-1/swap-1.png' }),
    ])
    const useCase = new DeleteCustomerUseCase(deps.customerRepository, deps.simulationRepository, deps.storage)

    await useCase.execute({ actor: makeActor(), customerId: 'customer-1' })

    expect(deps.storage.delete).toHaveBeenCalledWith('customers/acc-1/c.jpg')
    expect(deps.storage.delete).toHaveBeenCalledWith('simulations/acc-1/try-1.png')
    expect(deps.storage.delete).not.toHaveBeenCalledWith('simulations/acc-1/swap-1.png')
    expect(deps.simulationRepository.deleteMany).toHaveBeenCalledWith(['try-1'])
    expect(deps.customerRepository.delete).toHaveBeenCalledWith('customer-1')
  })
})

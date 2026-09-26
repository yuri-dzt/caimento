import { CreateSimulationUseCase } from '../../server/app/use-cases/simulations/create-simulation-use-case'
import { DeleteSimulationUseCase } from '../../server/app/use-cases/simulations/delete-simulation-use-case'
import {
  ATTEMPTS_EXHAUSTED_ERROR,
  GENERIC_GENERATION_ERROR,
  ProcessSimulationUseCase,
} from '../../server/app/use-cases/simulations/process-simulation-use-case'
import { buildFabricSwapPrompt } from '../../server/app/use-cases/simulations/prompts'
import { RecoverSimulationsUseCase } from '../../server/app/use-cases/simulations/recover-simulations-use-case'
import { NotFoundError, ServiceUnavailableError, ValidationError } from '../../server/domain/errors/app-error'
import { ImageGenerationError } from '../../server/domain/errors/image-generation-error'
import {
  makeActor,
  makeCustomer,
  makeFabric,
  makeGarment,
  makeSimulation,
  mockCustomerRepository,
  mockFabricRepository,
  mockGarmentRepository,
  mockImageProvider,
  mockJobQueue,
  mockSimulationRepository,
  mockStorage,
  OTHER_ACCOUNT_ID,
} from '../helpers/factories'

function makeDeps(configured = true) {
  const deps = {
    simulationRepository: mockSimulationRepository(),
    garmentRepository: mockGarmentRepository(),
    fabricRepository: mockFabricRepository(),
    customerRepository: mockCustomerRepository(),
    imageProvider: mockImageProvider(configured),
    jobQueue: mockJobQueue(),
    storage: mockStorage(),
  }
  deps.garmentRepository.findById.mockResolvedValue(makeGarment())
  deps.fabricRepository.findById.mockResolvedValue(makeFabric())
  deps.customerRepository.findById.mockResolvedValue(makeCustomer())
  return deps
}

function makeCreate(deps: ReturnType<typeof makeDeps>): CreateSimulationUseCase {
  return new CreateSimulationUseCase(
    deps.simulationRepository,
    deps.garmentRepository,
    deps.fabricRepository,
    deps.customerRepository,
    deps.imageProvider,
    deps.jobQueue,
  )
}

function makeProcess(deps: ReturnType<typeof makeDeps>): ProcessSimulationUseCase {
  return new ProcessSimulationUseCase(
    deps.simulationRepository,
    deps.garmentRepository,
    deps.fabricRepository,
    deps.customerRepository,
    deps.imageProvider,
    deps.storage,
  )
}

describe('CreateSimulationUseCase', () => {
  it('troca de tecido: cria PENDING e enfileira', async () => {
    const deps = makeDeps()
    const simulation = await makeCreate(deps).execute({
      actor: makeActor(),
      type: 'FABRIC_SWAP',
      garmentId: 'garment-1',
      fabricId: 'fabric-1',
      instructions: '  saia mais rodada  ',
    })

    expect(deps.simulationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: 'acc-1', createdById: 'user-owner', instructions: 'saia mais rodada' }),
    )
    expect(deps.jobQueue.enqueue).toHaveBeenCalledWith(simulation.id)
  })

  it('bloqueia se a IA não está configurada', async () => {
    const deps = makeDeps(false)
    await expect(
      makeCreate(deps).execute({ actor: makeActor(), type: 'FABRIC_SWAP', garmentId: 'g', fabricId: 'f' }),
    ).rejects.toThrow(ServiceUnavailableError)
  })

  it('tecido de outra loja não pode ser usado', async () => {
    const deps = makeDeps()
    deps.fabricRepository.findById.mockResolvedValue(makeFabric({ accountId: OTHER_ACCOUNT_ID }))
    await expect(
      makeCreate(deps).execute({ actor: makeActor(), type: 'FABRIC_SWAP', garmentId: 'g', fabricId: 'f' }),
    ).rejects.toThrow(NotFoundError)
    expect(deps.jobQueue.enqueue).not.toHaveBeenCalled()
  })

  it('troca de tecido exige peça e tecido', async () => {
    const deps = makeDeps()
    await expect(
      makeCreate(deps).execute({ actor: makeActor(), type: 'FABRIC_SWAP', garmentId: 'g' }),
    ).rejects.toThrow('Escolha o tecido.')
  })

  it('instruções com mais de 1000 caracteres são rejeitadas', async () => {
    const deps = makeDeps()
    await expect(
      makeCreate(deps).execute({
        actor: makeActor(),
        type: 'FABRIC_SWAP',
        garmentId: 'g',
        fabricId: 'f',
        instructions: 'a'.repeat(1001),
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('provador: cliente sem consentimento é bloqueada', async () => {
    const deps = makeDeps()
    deps.customerRepository.findById.mockResolvedValue(makeCustomer({ photoConsentAt: null }))
    await expect(
      makeCreate(deps).execute({ actor: makeActor(), type: 'TRY_ON', customerId: 'customer-1', garmentId: 'g' }),
    ).rejects.toThrow('consentimento')
  })

  it('provador: origem precisa ser troca de tecido concluída', async () => {
    const deps = makeDeps()
    deps.simulationRepository.findById.mockResolvedValue(makeSimulation({ status: 'PROCESSING' }))
    await expect(
      makeCreate(deps).execute({
        actor: makeActor(),
        type: 'TRY_ON',
        customerId: 'customer-1',
        sourceSimulationId: 'sim-1',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('provador a partir da troca de tecido herda peça e tecido', async () => {
    const deps = makeDeps()
    deps.simulationRepository.findById.mockResolvedValue(
      makeSimulation({ status: 'DONE', resultKey: 'simulations/acc-1/sim-1.png' }),
    )
    await makeCreate(deps).execute({
      actor: makeActor(),
      type: 'TRY_ON',
      customerId: 'customer-1',
      sourceSimulationId: 'sim-1',
    })
    expect(deps.simulationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TRY_ON',
        garmentId: 'garment-1',
        fabricId: 'fabric-1',
        customerId: 'customer-1',
        sourceSimulationId: 'sim-1',
      }),
    )
  })
})

describe('ProcessSimulationUseCase', () => {
  it('troca de tecido: manda peça e tecido (nessa ordem) e salva o resultado', async () => {
    const deps = makeDeps()
    deps.simulationRepository.claim.mockResolvedValue(makeSimulation({ status: 'PROCESSING', attempts: 1 }))
    deps.storage.download.mockImplementation(async (key: string) => Buffer.from(key))

    await makeProcess(deps).execute({ simulationId: 'sim-1' })

    const request = deps.imageProvider.generate.mock.calls[0][0]
    expect(request.images.map((img) => img.buffer.toString())).toEqual(['garments/acc-1/g.jpg', 'fabrics/acc-1/f.png'])
    expect(request.images[1].mimeType).toBe('image/png')
    expect(request.prompt).toContain('linen')
    expect(deps.storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'simulations/acc-1/sim-1.png', mimeType: 'image/png' }),
    )
    expect(deps.simulationRepository.markDone).toHaveBeenCalledWith('sim-1', {
      resultKey: 'simulations/acc-1/sim-1.png',
      provider: 'fake',
      model: 'fake-model',
    })
  })

  it('provador: usa foto da cliente + resultado da troca de tecido', async () => {
    const deps = makeDeps()
    deps.simulationRepository.claim.mockResolvedValue(
      makeSimulation({ type: 'TRY_ON', customerId: 'customer-1', sourceSimulationId: 'swap-1', attempts: 1 }),
    )
    deps.simulationRepository.findById.mockResolvedValue(
      makeSimulation({ id: 'swap-1', status: 'DONE', resultKey: 'simulations/acc-1/swap-1.png' }),
    )
    deps.storage.download.mockImplementation(async (key: string) => Buffer.from(key))

    await makeProcess(deps).execute({ simulationId: 'sim-1' })

    const request = deps.imageProvider.generate.mock.calls[0][0]
    expect(request.images.map((img) => img.buffer.toString())).toEqual([
      'customers/acc-1/c.jpg',
      'simulations/acc-1/swap-1.png',
    ])
  })

  it('não faz nada se outra execução já pegou a simulação', async () => {
    const deps = makeDeps()
    deps.simulationRepository.claim.mockResolvedValue(null)

    await makeProcess(deps).execute({ simulationId: 'sim-1' })
    expect(deps.imageProvider.generate).not.toHaveBeenCalled()
  })

  it('erro da IA vira FAILED com a mensagem amigável', async () => {
    const deps = makeDeps()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deps.simulationRepository.claim.mockResolvedValue(makeSimulation({ attempts: 1 }))
    deps.imageProvider.generate.mockRejectedValue(new ImageGenerationError('A IA recusou gerar esta imagem.'))

    await makeProcess(deps).execute({ simulationId: 'sim-1' })
    expect(deps.simulationRepository.markFailed).toHaveBeenCalledWith('sim-1', 'A IA recusou gerar esta imagem.')
  })

  it('erro inesperado vira mensagem genérica (não vaza detalhe interno)', async () => {
    const deps = makeDeps()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deps.simulationRepository.claim.mockResolvedValue(makeSimulation({ attempts: 1 }))
    deps.storage.download.mockRejectedValue(new Error('ECONNREFUSED 10.0.0.5:9000'))

    await makeProcess(deps).execute({ simulationId: 'sim-1' })
    expect(deps.simulationRepository.markFailed).toHaveBeenCalledWith('sim-1', GENERIC_GENERATION_ERROR)
  })

  it('tecido excluído no meio do caminho vira FAILED', async () => {
    const deps = makeDeps()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deps.simulationRepository.claim.mockResolvedValue(makeSimulation({ attempts: 1 }))
    deps.fabricRepository.findById.mockResolvedValue(null)

    await makeProcess(deps).execute({ simulationId: 'sim-1' })
    expect(deps.simulationRepository.markFailed).toHaveBeenCalledWith(
      'sim-1',
      'A peça ou o tecido desta simulação foi excluído.',
    )
  })

  it('tentativas esgotadas: falha sem chamar a IA', async () => {
    const deps = makeDeps()
    deps.simulationRepository.claim.mockResolvedValue(makeSimulation({ attempts: 4 }))

    await makeProcess(deps).execute({ simulationId: 'sim-1' })
    expect(deps.imageProvider.generate).not.toHaveBeenCalled()
    expect(deps.simulationRepository.markFailed).toHaveBeenCalledWith('sim-1', ATTEMPTS_EXHAUSTED_ERROR)
  })
})

describe('RecoverSimulationsUseCase', () => {
  it('volta PROCESSING órfãs para PENDING e reenfileira as pendentes', async () => {
    const deps = makeDeps()
    deps.simulationRepository.listByStatus.mockResolvedValue([makeSimulation({ id: 'a' }), makeSimulation({ id: 'b' })])

    const count = await new RecoverSimulationsUseCase(deps.simulationRepository, deps.jobQueue).execute()

    expect(deps.simulationRepository.resetProcessing).toHaveBeenCalled()
    expect(deps.jobQueue.enqueue).toHaveBeenCalledTimes(2)
    expect(count).toBe(2)
  })
})

describe('DeleteSimulationUseCase', () => {
  it('não exclui simulação em processamento', async () => {
    const deps = makeDeps()
    deps.simulationRepository.findById.mockResolvedValue(makeSimulation({ status: 'PROCESSING' }))

    await expect(
      new DeleteSimulationUseCase(deps.simulationRepository, deps.storage).execute({
        actor: makeActor(),
        simulationId: 'sim-1',
      }),
    ).rejects.toThrow(ValidationError)
  })
})

describe('buildFabricSwapPrompt', () => {
  it('inclui comportamento do tecido, notas e instruções', () => {
    const prompt = buildFabricSwapPrompt({
      fabricType: 'SATIN',
      fabricDescription: 'cetim pesado',
      instructions: 'manga curta',
    })
    expect(prompt).toContain('satin')
    expect(prompt).toContain('cetim pesado')
    expect(prompt).toContain('manga curta')
  })
})

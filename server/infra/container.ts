import { ChangePasswordUseCase } from '../app/use-cases/auth/change-password-use-case'
import { GetMeUseCase } from '../app/use-cases/auth/get-me-use-case'
import { LoginUseCase } from '../app/use-cases/auth/login-use-case'
import { CreateAccountUseCase } from '../app/use-cases/accounts/create-account-use-case'
import { ListAccountsUseCase } from '../app/use-cases/accounts/list-accounts-use-case'
import { UpdateAccountUseCase } from '../app/use-cases/accounts/update-account-use-case'
import { CreateCustomerUseCase } from '../app/use-cases/customers/create-customer-use-case'
import { DeleteCustomerUseCase } from '../app/use-cases/customers/delete-customer-use-case'
import { ListCustomersUseCase } from '../app/use-cases/customers/list-customers-use-case'
import { UpdateCustomerPhotoUseCase } from '../app/use-cases/customers/update-customer-photo-use-case'
import { CreateFabricUseCase } from '../app/use-cases/fabrics/create-fabric-use-case'
import { DeleteFabricUseCase } from '../app/use-cases/fabrics/delete-fabric-use-case'
import { ListFabricsUseCase } from '../app/use-cases/fabrics/list-fabrics-use-case'
import { CreateGarmentUseCase } from '../app/use-cases/garments/create-garment-use-case'
import { DeleteGarmentUseCase } from '../app/use-cases/garments/delete-garment-use-case'
import { ListGarmentsUseCase } from '../app/use-cases/garments/list-garments-use-case'
import { CreateSimulationUseCase } from '../app/use-cases/simulations/create-simulation-use-case'
import { DeleteSimulationUseCase } from '../app/use-cases/simulations/delete-simulation-use-case'
import { GetSimulationUseCase } from '../app/use-cases/simulations/get-simulation-use-case'
import { ListSimulationsUseCase } from '../app/use-cases/simulations/list-simulations-use-case'
import { ProcessSimulationUseCase } from '../app/use-cases/simulations/process-simulation-use-case'
import { RecoverSimulationsUseCase } from '../app/use-cases/simulations/recover-simulations-use-case'
import { CreateUserUseCase } from '../app/use-cases/users/create-user-use-case'
import { ListUsersUseCase } from '../app/use-cases/users/list-users-use-case'
import { UpdateUserUseCase } from '../app/use-cases/users/update-user-use-case'
import { env } from './config/env'
import { minioBucket, minioClient, minioRegion } from './config/minio'
import { prisma } from './config/prisma'
import { createFileSigner } from './http/signing'
import { PrismaAccountRepository } from './repositories/prisma/prisma-account-repository'
import { PrismaCustomerRepository } from './repositories/prisma/prisma-customer-repository'
import { PrismaFabricRepository } from './repositories/prisma/prisma-fabric-repository'
import { PrismaGarmentRepository } from './repositories/prisma/prisma-garment-repository'
import { PrismaSimulationRepository } from './repositories/prisma/prisma-simulation-repository'
import { PrismaUserRepository } from './repositories/prisma/prisma-user-repository'
import { GeminiImageProvider } from './services/gemini-image-provider'
import type { IImageGenerationProvider } from '../contracts/services/image-generation-provider'
import { InProcessJobQueue } from './services/in-process-job-queue'
import { OpenAIImageProvider } from './services/openai-image-provider'
import { ScryptPasswordHasher } from './services/scrypt-password-hasher'
import { MinioStorageProvider } from './storage/minio-storage-provider'

// ---- singletons (stateless, compartilham o Prisma client) ----
export const fileSigner = createFileSigner(env.APP_SECRET, env.FILE_URL_TTL_SECONDS)
export const storage = new MinioStorageProvider(minioClient, minioBucket, fileSigner, minioRegion)
export const passwordHasher = new ScryptPasswordHasher()
// provedor de IA escolhido por IMAGE_PROVIDER (padrão: openai)
export const imageProvider: IImageGenerationProvider =
  env.IMAGE_PROVIDER === 'gemini'
    ? new GeminiImageProvider({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_IMAGE_MODEL,
        timeoutMs: env.SIMULATION_TIMEOUT_MS,
      })
    : new OpenAIImageProvider({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_IMAGE_MODEL,
        quality: env.OPENAI_IMAGE_QUALITY,
        size: env.OPENAI_IMAGE_SIZE,
        inputFidelity: env.OPENAI_INPUT_FIDELITY,
        timeoutMs: env.SIMULATION_TIMEOUT_MS,
      })
export const jobQueue = new InProcessJobQueue(env.SIMULATION_CONCURRENCY)

export const accountRepository = new PrismaAccountRepository(prisma)
export const userRepository = new PrismaUserRepository(prisma)
export const fabricRepository = new PrismaFabricRepository(prisma)
export const garmentRepository = new PrismaGarmentRepository(prisma)
export const customerRepository = new PrismaCustomerRepository(prisma)
export const simulationRepository = new PrismaSimulationRepository(prisma)

// ---- auth ----
export const makeLoginUseCase = (): LoginUseCase =>
  new LoginUseCase(userRepository, accountRepository, passwordHasher)
export const makeGetMeUseCase = (): GetMeUseCase => new GetMeUseCase(userRepository, accountRepository)
export const makeChangePasswordUseCase = (): ChangePasswordUseCase =>
  new ChangePasswordUseCase(userRepository, passwordHasher)

// ---- accounts ----
export const makeCreateAccountUseCase = (): CreateAccountUseCase =>
  new CreateAccountUseCase(accountRepository, userRepository, passwordHasher)
export const makeListAccountsUseCase = (): ListAccountsUseCase => new ListAccountsUseCase(accountRepository)
export const makeUpdateAccountUseCase = (): UpdateAccountUseCase => new UpdateAccountUseCase(accountRepository)

// ---- users ----
export const makeCreateUserUseCase = (): CreateUserUseCase =>
  new CreateUserUseCase(userRepository, accountRepository, passwordHasher)
export const makeListUsersUseCase = (): ListUsersUseCase => new ListUsersUseCase(userRepository)
export const makeUpdateUserUseCase = (): UpdateUserUseCase => new UpdateUserUseCase(userRepository, passwordHasher)

// ---- fabrics ----
export const makeCreateFabricUseCase = (): CreateFabricUseCase => new CreateFabricUseCase(fabricRepository, storage)
export const makeListFabricsUseCase = (): ListFabricsUseCase => new ListFabricsUseCase(fabricRepository)
export const makeDeleteFabricUseCase = (): DeleteFabricUseCase => new DeleteFabricUseCase(fabricRepository, storage)

// ---- garments ----
export const makeCreateGarmentUseCase = (): CreateGarmentUseCase => new CreateGarmentUseCase(garmentRepository, storage)
export const makeListGarmentsUseCase = (): ListGarmentsUseCase => new ListGarmentsUseCase(garmentRepository)
export const makeDeleteGarmentUseCase = (): DeleteGarmentUseCase => new DeleteGarmentUseCase(garmentRepository, storage)

// ---- customers ----
export const makeCreateCustomerUseCase = (): CreateCustomerUseCase =>
  new CreateCustomerUseCase(customerRepository, storage)
export const makeListCustomersUseCase = (): ListCustomersUseCase => new ListCustomersUseCase(customerRepository)
export const makeUpdateCustomerPhotoUseCase = (): UpdateCustomerPhotoUseCase =>
  new UpdateCustomerPhotoUseCase(customerRepository, storage)
export const makeDeleteCustomerUseCase = (): DeleteCustomerUseCase =>
  new DeleteCustomerUseCase(customerRepository, simulationRepository, storage)

// ---- simulations ----
export const makeCreateSimulationUseCase = (): CreateSimulationUseCase =>
  new CreateSimulationUseCase(
    simulationRepository,
    garmentRepository,
    fabricRepository,
    customerRepository,
    imageProvider,
    jobQueue,
  )
export const makeProcessSimulationUseCase = (): ProcessSimulationUseCase =>
  new ProcessSimulationUseCase(
    simulationRepository,
    garmentRepository,
    fabricRepository,
    customerRepository,
    imageProvider,
    storage,
  )
export const makeRecoverSimulationsUseCase = (): RecoverSimulationsUseCase =>
  new RecoverSimulationsUseCase(simulationRepository, jobQueue)
export const makeListSimulationsUseCase = (): ListSimulationsUseCase => new ListSimulationsUseCase(simulationRepository)
export const makeGetSimulationUseCase = (): GetSimulationUseCase => new GetSimulationUseCase(simulationRepository)
export const makeDeleteSimulationUseCase = (): DeleteSimulationUseCase =>
  new DeleteSimulationUseCase(simulationRepository, storage)

// fila chama o processamento (ligado aqui para evitar dependência circular)
const processSimulation = makeProcessSimulationUseCase()
jobQueue.setHandler((simulationId) => processSimulation.execute({ simulationId }))

import type { ICustomerRepository } from '../../../contracts/repositories/customer-repository'
import type { ISimulationRepository } from '../../../contracts/repositories/simulation-repository'
import type { IStorageProvider } from '../../../contracts/storage'
import { Permission } from '../../../domain/enums/permission'
import { SimulationType } from '../../../domain/enums/simulation'
import { NotFoundError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, assertSameAccount } from '../../policies/permissions'
import { deleteFilesSafely } from '../../shared/storage-cleanup'

export interface DeleteCustomerInput {
  actor: AuthUser
  customerId: string
}

/**
 * LGPD: apaga a foto da cliente e todas as simulações de provador virtual dela
 * (o resultado contém o rosto e o corpo da cliente).
 */
export class DeleteCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly simulationRepository: ISimulationRepository,
    private readonly storage: IStorageProvider,
  ) {}

  async execute(input: DeleteCustomerInput): Promise<void> {
    assertPermission(input.actor, Permission.DELETE)

    const customer = await this.customerRepository.findById(input.customerId)
    if (!customer) throw new NotFoundError('Cliente não encontrada.')
    assertSameAccount(input.actor, customer.accountId)

    const tryOns = (await this.simulationRepository.listByCustomer(customer.id)).filter(
      (simulation) => simulation.type === SimulationType.TRY_ON,
    )

    // storage antes do banco: MinIO não é transacional
    await deleteFilesSafely(this.storage, [customer.photoKey, ...tryOns.map((simulation) => simulation.resultKey)])
    if (tryOns.length > 0) {
      await this.simulationRepository.deleteMany(tryOns.map((simulation) => simulation.id))
    }
    await this.customerRepository.delete(customer.id)
  }
}

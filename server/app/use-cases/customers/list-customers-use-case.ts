import type { ICustomerRepository } from '../../../contracts/repositories/customer-repository'
import type { Customer } from '../../../domain/entities/customer'
import { Permission } from '../../../domain/enums/permission'
import type { AuthUser } from '../../policies/auth-user'
import { accountScope, assertPermission } from '../../policies/permissions'

export interface ListCustomersInput {
  actor: AuthUser
}

export class ListCustomersUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: ListCustomersInput): Promise<Customer[]> {
    assertPermission(input.actor, Permission.VIEW)
    return this.customerRepository.list({ accountId: accountScope(input.actor) })
  }
}

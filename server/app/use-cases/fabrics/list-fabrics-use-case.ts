import type { IFabricRepository } from '../../../contracts/repositories/fabric-repository'
import type { Fabric } from '../../../domain/entities/fabric'
import { Permission } from '../../../domain/enums/permission'
import type { AuthUser } from '../../policies/auth-user'
import { accountScope, assertPermission } from '../../policies/permissions'

export interface ListFabricsInput {
  actor: AuthUser
}

export class ListFabricsUseCase {
  constructor(private readonly fabricRepository: IFabricRepository) {}

  async execute(input: ListFabricsInput): Promise<Fabric[]> {
    assertPermission(input.actor, Permission.VIEW)
    return this.fabricRepository.list({ accountId: accountScope(input.actor) })
  }
}

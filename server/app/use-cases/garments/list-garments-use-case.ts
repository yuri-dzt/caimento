import type { IGarmentRepository } from '../../../contracts/repositories/garment-repository'
import type { Garment } from '../../../domain/entities/garment'
import { Permission } from '../../../domain/enums/permission'
import type { AuthUser } from '../../policies/auth-user'
import { accountScope, assertPermission } from '../../policies/permissions'

export interface ListGarmentsInput {
  actor: AuthUser
}

export class ListGarmentsUseCase {
  constructor(private readonly garmentRepository: IGarmentRepository) {}

  async execute(input: ListGarmentsInput): Promise<Garment[]> {
    assertPermission(input.actor, Permission.VIEW)
    return this.garmentRepository.list({ accountId: accountScope(input.actor) })
  }
}

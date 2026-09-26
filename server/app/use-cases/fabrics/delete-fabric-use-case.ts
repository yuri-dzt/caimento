import type { IFabricRepository } from '../../../contracts/repositories/fabric-repository'
import type { IStorageProvider } from '../../../contracts/storage'
import { Permission } from '../../../domain/enums/permission'
import { NotFoundError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, assertSameAccount } from '../../policies/permissions'
import { deleteFilesSafely } from '../../shared/storage-cleanup'

export interface DeleteFabricInput {
  actor: AuthUser
  fabricId: string
}

/** Simulações que usaram o tecido continuam no histórico (fabricId vira null) */
export class DeleteFabricUseCase {
  constructor(
    private readonly fabricRepository: IFabricRepository,
    private readonly storage: IStorageProvider,
  ) {}

  async execute(input: DeleteFabricInput): Promise<void> {
    assertPermission(input.actor, Permission.DELETE)

    const fabric = await this.fabricRepository.findById(input.fabricId)
    if (!fabric) throw new NotFoundError('Tecido não encontrado.')
    assertSameAccount(input.actor, fabric.accountId)

    // storage antes do banco: MinIO não é transacional
    await deleteFilesSafely(this.storage, [fabric.imageKey])
    await this.fabricRepository.delete(fabric.id)
  }
}

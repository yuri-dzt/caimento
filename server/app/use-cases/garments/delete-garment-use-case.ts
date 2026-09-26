import type { IGarmentRepository } from '../../../contracts/repositories/garment-repository'
import type { IStorageProvider } from '../../../contracts/storage'
import { Permission } from '../../../domain/enums/permission'
import { NotFoundError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, assertSameAccount } from '../../policies/permissions'
import { deleteFilesSafely } from '../../shared/storage-cleanup'

export interface DeleteGarmentInput {
  actor: AuthUser
  garmentId: string
}

/** Simulações que usaram a peça continuam no histórico (garmentId vira null) */
export class DeleteGarmentUseCase {
  constructor(
    private readonly garmentRepository: IGarmentRepository,
    private readonly storage: IStorageProvider,
  ) {}

  async execute(input: DeleteGarmentInput): Promise<void> {
    assertPermission(input.actor, Permission.DELETE)

    const garment = await this.garmentRepository.findById(input.garmentId)
    if (!garment) throw new NotFoundError('Peça não encontrada.')
    assertSameAccount(input.actor, garment.accountId)

    await deleteFilesSafely(this.storage, [garment.imageKey])
    await this.garmentRepository.delete(garment.id)
  }
}

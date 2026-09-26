import type { IGarmentRepository } from '../../../contracts/repositories/garment-repository'
import type { IStorageProvider } from '../../../contracts/storage'
import type { Garment } from '../../../domain/entities/garment'
import { Permission } from '../../../domain/enums/permission'
import { ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, requireAccountId } from '../../policies/permissions'
import { assertValidImage, buildFileKey, StorageFolder, type ImageFile } from '../../shared/images'
import { deleteFilesSafely } from '../../shared/storage-cleanup'
import { optionalText } from '../../shared/text'

export interface CreateGarmentInput {
  actor: AuthUser
  name: string
  description?: string | null
  image: ImageFile
}

export class CreateGarmentUseCase {
  constructor(
    private readonly garmentRepository: IGarmentRepository,
    private readonly storage: IStorageProvider,
  ) {}

  async execute(input: CreateGarmentInput): Promise<Garment> {
    assertPermission(input.actor, Permission.CREATE)
    const accountId = requireAccountId(input.actor)

    const name = input.name.trim()
    if (!name) throw new ValidationError('Informe o nome da peça.')
    assertValidImage(input.image)

    const imageKey = buildFileKey(StorageFolder.GARMENTS, accountId, input.image.mimeType)
    await this.storage.upload({ key: imageKey, buffer: input.image.buffer, mimeType: input.image.mimeType })

    try {
      return await this.garmentRepository.create({
        accountId,
        name,
        description: optionalText(input.description),
        imageKey,
      })
    } catch (error) {
      await deleteFilesSafely(this.storage, [imageKey])
      throw error
    }
  }
}

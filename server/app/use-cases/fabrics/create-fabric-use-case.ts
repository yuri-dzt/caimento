import type { IFabricRepository } from '../../../contracts/repositories/fabric-repository'
import type { IStorageProvider } from '../../../contracts/storage'
import type { Fabric } from '../../../domain/entities/fabric'
import type { FabricType } from '../../../domain/enums/fabric-type'
import { Permission } from '../../../domain/enums/permission'
import { ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, requireAccountId } from '../../policies/permissions'
import { assertValidImage, buildFileKey, StorageFolder, type ImageFile } from '../../shared/images'
import { deleteFilesSafely } from '../../shared/storage-cleanup'
import { optionalText } from '../../shared/text'

export interface CreateFabricInput {
  actor: AuthUser
  name: string
  fabricType: FabricType
  description?: string | null
  image: ImageFile
}

export class CreateFabricUseCase {
  constructor(
    private readonly fabricRepository: IFabricRepository,
    private readonly storage: IStorageProvider,
  ) {}

  async execute(input: CreateFabricInput): Promise<Fabric> {
    assertPermission(input.actor, Permission.CREATE)
    const accountId = requireAccountId(input.actor)

    const name = input.name.trim()
    if (!name) throw new ValidationError('Informe o nome do tecido.')
    assertValidImage(input.image)

    const imageKey = buildFileKey(StorageFolder.FABRICS, accountId, input.image.mimeType)
    await this.storage.upload({ key: imageKey, buffer: input.image.buffer, mimeType: input.image.mimeType })

    try {
      return await this.fabricRepository.create({
        accountId,
        name,
        fabricType: input.fabricType,
        description: optionalText(input.description),
        imageKey,
      })
    } catch (error) {
      await deleteFilesSafely(this.storage, [imageKey])
      throw error
    }
  }
}

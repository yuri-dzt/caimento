import type { ICustomerRepository } from '../../../contracts/repositories/customer-repository'
import type { IStorageProvider } from '../../../contracts/storage'
import type { Customer } from '../../../domain/entities/customer'
import { Permission } from '../../../domain/enums/permission'
import { ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, requireAccountId } from '../../policies/permissions'
import { assertValidImage, buildFileKey, StorageFolder, type ImageFile } from '../../shared/images'
import { deleteFilesSafely } from '../../shared/storage-cleanup'
import { optionalText } from '../../shared/text'

export interface CreateCustomerInput {
  actor: AuthUser
  name: string
  phone?: string | null
  notes?: string | null
  photo?: ImageFile | null
  /** Cliente autorizou o uso da foto (LGPD) */
  photoConsent: boolean
}

export const PHOTO_CONSENT_REQUIRED = 'Para salvar a foto é preciso marcar o consentimento da cliente.'

export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly storage: IStorageProvider,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    assertPermission(input.actor, Permission.CREATE)
    const accountId = requireAccountId(input.actor)

    const name = input.name.trim()
    if (!name) throw new ValidationError('Informe o nome da cliente.')

    let photoKey: string | null = null
    if (input.photo) {
      if (!input.photoConsent) throw new ValidationError(PHOTO_CONSENT_REQUIRED)
      assertValidImage(input.photo)
      photoKey = buildFileKey(StorageFolder.CUSTOMERS, accountId, input.photo.mimeType)
      await this.storage.upload({ key: photoKey, buffer: input.photo.buffer, mimeType: input.photo.mimeType })
    }

    try {
      return await this.customerRepository.create({
        accountId,
        name,
        phone: optionalText(input.phone),
        notes: optionalText(input.notes),
        photoKey,
        photoConsentAt: photoKey ? this.now() : null,
      })
    } catch (error) {
      await deleteFilesSafely(this.storage, [photoKey])
      throw error
    }
  }
}

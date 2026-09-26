import type { ICustomerRepository } from '../../../contracts/repositories/customer-repository'
import type { IStorageProvider } from '../../../contracts/storage'
import type { Customer } from '../../../domain/entities/customer'
import { Permission } from '../../../domain/enums/permission'
import { NotFoundError, ValidationError } from '../../../domain/errors/app-error'
import type { AuthUser } from '../../policies/auth-user'
import { assertPermission, assertSameAccount } from '../../policies/permissions'
import { assertValidImage, buildFileKey, StorageFolder, type ImageFile } from '../../shared/images'
import { deleteFilesSafely } from '../../shared/storage-cleanup'
import { PHOTO_CONSENT_REQUIRED } from './create-customer-use-case'

export interface UpdateCustomerPhotoInput {
  actor: AuthUser
  customerId: string
  photo: ImageFile
  photoConsent: boolean
}

/** Troca a foto da cliente. A foto anterior é apagada do storage. */
export class UpdateCustomerPhotoUseCase {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly storage: IStorageProvider,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: UpdateCustomerPhotoInput): Promise<Customer> {
    assertPermission(input.actor, Permission.EDIT)

    const customer = await this.customerRepository.findById(input.customerId)
    if (!customer) throw new NotFoundError('Cliente não encontrada.')
    assertSameAccount(input.actor, customer.accountId)

    if (!input.photoConsent) throw new ValidationError(PHOTO_CONSENT_REQUIRED)
    assertValidImage(input.photo)

    const photoKey = buildFileKey(StorageFolder.CUSTOMERS, customer.accountId, input.photo.mimeType)
    await this.storage.upload({ key: photoKey, buffer: input.photo.buffer, mimeType: input.photo.mimeType })

    let updated: Customer
    try {
      updated = await this.customerRepository.update(customer.id, { photoKey, photoConsentAt: this.now() })
    } catch (error) {
      await deleteFilesSafely(this.storage, [photoKey])
      throw error
    }

    await deleteFilesSafely(this.storage, [customer.photoKey])
    return updated
  }
}

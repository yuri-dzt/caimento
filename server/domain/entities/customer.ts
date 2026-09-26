export interface Customer {
  id: string
  accountId: string
  name: string
  phone: string | null
  notes: string | null
  photoKey: string | null
  photoConsentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Foto só pode ser usada com consentimento registrado (LGPD) */
export function canUseCustomerPhoto(customer: Customer): boolean {
  return customer.photoKey !== null && customer.photoConsentAt !== null
}

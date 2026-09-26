export interface Garment {
  id: string
  accountId: string
  name: string
  description: string | null
  imageKey: string
  createdAt: Date
  updatedAt: Date
}

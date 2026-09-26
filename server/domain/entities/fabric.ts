import type { FabricType } from '../enums/fabric-type'

export interface Fabric {
  id: string
  accountId: string
  name: string
  fabricType: FabricType
  description: string | null
  imageKey: string
  createdAt: Date
  updatedAt: Date
}

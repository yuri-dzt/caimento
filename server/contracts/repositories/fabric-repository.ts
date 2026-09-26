import type { Fabric } from '../../domain/entities/fabric'
import type { FabricType } from '../../domain/enums/fabric-type'

export interface CreateFabricData {
  accountId: string
  name: string
  fabricType: FabricType
  description: string | null
  imageKey: string
}

export interface ListByAccountFilter {
  /** undefined = todas as lojas (admin) */
  accountId?: string
}

export interface IFabricRepository {
  create(data: CreateFabricData): Promise<Fabric>
  findById(id: string): Promise<Fabric | null>
  list(filter: ListByAccountFilter): Promise<Fabric[]>
  delete(id: string): Promise<void>
}

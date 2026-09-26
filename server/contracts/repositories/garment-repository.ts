import type { Garment } from '../../domain/entities/garment'
import type { ListByAccountFilter } from './fabric-repository'

export interface CreateGarmentData {
  accountId: string
  name: string
  description: string | null
  imageKey: string
}

export interface IGarmentRepository {
  create(data: CreateGarmentData): Promise<Garment>
  findById(id: string): Promise<Garment | null>
  list(filter: ListByAccountFilter): Promise<Garment[]>
  delete(id: string): Promise<void>
}

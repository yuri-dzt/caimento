import type { PrismaClient } from '../../../generated/prisma'
import type { ListByAccountFilter } from '../../../contracts/repositories/fabric-repository'
import type { CreateGarmentData, IGarmentRepository } from '../../../contracts/repositories/garment-repository'
import type { Garment } from '../../../domain/entities/garment'

export class PrismaGarmentRepository implements IGarmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateGarmentData): Promise<Garment> {
    return this.prisma.garment.create({ data })
  }

  findById(id: string): Promise<Garment | null> {
    return this.prisma.garment.findUnique({ where: { id } })
  }

  list(filter: ListByAccountFilter): Promise<Garment[]> {
    return this.prisma.garment.findMany({
      where: filter.accountId ? { accountId: filter.accountId } : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.garment.delete({ where: { id } })
  }
}

import type { PrismaClient } from '../../../generated/prisma'
import type {
  CreateFabricData,
  IFabricRepository,
  ListByAccountFilter,
} from '../../../contracts/repositories/fabric-repository'
import type { Fabric } from '../../../domain/entities/fabric'

export class PrismaFabricRepository implements IFabricRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateFabricData): Promise<Fabric> {
    return this.prisma.fabric.create({ data })
  }

  findById(id: string): Promise<Fabric | null> {
    return this.prisma.fabric.findUnique({ where: { id } })
  }

  list(filter: ListByAccountFilter): Promise<Fabric[]> {
    return this.prisma.fabric.findMany({
      where: filter.accountId ? { accountId: filter.accountId } : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.fabric.delete({ where: { id } })
  }
}

import type { Prisma, PrismaClient } from '../../../generated/prisma'
import type {
  CompleteSimulationData,
  CreateSimulationData,
  ISimulationRepository,
  ListSimulationsFilter,
} from '../../../contracts/repositories/simulation-repository'
import type { Simulation } from '../../../domain/entities/simulation'
import type { SimulationDetails } from '../../../domain/entities/simulation-details'
import { SimulationStatus } from '../../../domain/enums/simulation'

const detailsInclude = {
  garment: { select: { id: true, name: true, imageKey: true } },
  fabric: { select: { id: true, name: true, fabricType: true, imageKey: true } },
  customer: { select: { id: true, name: true } },
} satisfies Prisma.SimulationInclude

export class PrismaSimulationRepository implements ISimulationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateSimulationData): Promise<Simulation> {
    return this.prisma.simulation.create({ data: { ...data, status: SimulationStatus.PENDING } })
  }

  findById(id: string): Promise<Simulation | null> {
    return this.prisma.simulation.findUnique({ where: { id } })
  }

  findDetailsById(id: string): Promise<SimulationDetails | null> {
    return this.prisma.simulation.findUnique({ where: { id }, include: detailsInclude })
  }

  list(filter: ListSimulationsFilter): Promise<SimulationDetails[]> {
    return this.prisma.simulation.findMany({
      where: {
        ...(filter.accountId ? { accountId: filter.accountId } : {}),
        ...(filter.customerId ? { customerId: filter.customerId } : {}),
        ...(filter.type ? { type: filter.type } : {}),
      },
      include: detailsInclude,
      orderBy: { createdAt: 'desc' },
      take: filter.limit,
    })
  }

  listByStatus(statuses: SimulationStatus[]): Promise<Simulation[]> {
    return this.prisma.simulation.findMany({
      where: { status: { in: statuses } },
      orderBy: { createdAt: 'asc' },
    })
  }

  listByCustomer(customerId: string): Promise<Simulation[]> {
    return this.prisma.simulation.findMany({ where: { customerId } })
  }

  async claim(id: string): Promise<Simulation | null> {
    // updateMany com filtro de status = trava otimista (só 1 execução pega)
    const { count } = await this.prisma.simulation.updateMany({
      where: { id, status: SimulationStatus.PENDING },
      data: { status: SimulationStatus.PROCESSING, startedAt: new Date(), attempts: { increment: 1 } },
    })
    if (count === 0) return null
    return this.findById(id)
  }

  async resetProcessing(): Promise<number> {
    const { count } = await this.prisma.simulation.updateMany({
      where: { status: SimulationStatus.PROCESSING },
      data: { status: SimulationStatus.PENDING },
    })
    return count
  }

  markDone(id: string, data: CompleteSimulationData): Promise<Simulation> {
    return this.prisma.simulation.update({
      where: { id },
      data: { ...data, status: SimulationStatus.DONE, errorMessage: null, completedAt: new Date() },
    })
  }

  markFailed(id: string, errorMessage: string): Promise<Simulation> {
    return this.prisma.simulation.update({
      where: { id },
      data: { status: SimulationStatus.FAILED, errorMessage: errorMessage.slice(0, 500), completedAt: new Date() },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.simulation.delete({ where: { id } })
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.prisma.simulation.deleteMany({ where: { id: { in: ids } } })
  }
}

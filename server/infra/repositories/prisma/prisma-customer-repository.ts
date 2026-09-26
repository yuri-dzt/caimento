import type { PrismaClient } from '../../../generated/prisma'
import type {
  CreateCustomerData,
  ICustomerRepository,
  UpdateCustomerData,
} from '../../../contracts/repositories/customer-repository'
import type { ListByAccountFilter } from '../../../contracts/repositories/fabric-repository'
import type { Customer } from '../../../domain/entities/customer'

export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateCustomerData): Promise<Customer> {
    return this.prisma.customer.create({ data })
  }

  findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } })
  }

  list(filter: ListByAccountFilter): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: filter.accountId ? { accountId: filter.accountId } : undefined,
      orderBy: { name: 'asc' },
    })
  }

  update(id: string, data: UpdateCustomerData): Promise<Customer> {
    return this.prisma.customer.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({ where: { id } })
  }
}

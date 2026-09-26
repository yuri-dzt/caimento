import type { PrismaClient } from '../../../generated/prisma'
import type {
  CreateAccountData,
  IAccountRepository,
  UpdateAccountData,
} from '../../../contracts/repositories/account-repository'
import type { Account } from '../../../domain/entities/account'

export class PrismaAccountRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateAccountData): Promise<Account> {
    return this.prisma.account.create({ data })
  }

  findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({ where: { id } })
  }

  list(): Promise<Account[]> {
    return this.prisma.account.findMany({ orderBy: { name: 'asc' } })
  }

  update(id: string, data: UpdateAccountData): Promise<Account> {
    return this.prisma.account.update({ where: { id }, data })
  }
}

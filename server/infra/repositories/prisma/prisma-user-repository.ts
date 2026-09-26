import type { PrismaClient } from '../../../generated/prisma'
import type {
  CreateUserData,
  IUserRepository,
  ListUsersFilter,
  UpdateUserData,
} from '../../../contracts/repositories/user-repository'
import type { User } from '../../../domain/entities/user'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data })
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  list(filter: ListUsersFilter): Promise<User[]> {
    return this.prisma.user.findMany({
      where: filter.accountId ? { accountId: filter.accountId } : undefined,
      orderBy: [{ accountType: 'asc' }, { name: 'asc' }],
    })
  }

  update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({ where: { id }, data })
  }
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { AccountType } from '../../../domain/enums/account-type'
import { ALL_PERMISSIONS, type Permission } from '../../../domain/enums/permission'
import { makeCreateUserUseCase, makeListUsersUseCase, makeUpdateUserUseCase } from '../../container'
import { presentUser, type UserResponse } from '../presenters'

const permissionsSchema = z.array(z.enum(ALL_PERMISSIONS as [Permission, ...Permission[]]))

const createSchema = z.object({
  name: z.string(),
  email: z.email('E-mail inválido.'),
  password: z.string(),
  accountType: z.enum([AccountType.ADMIN, AccountType.OWNER, AccountType.EMPLOYEE]).default(AccountType.EMPLOYEE),
  permissions: permissionsSchema.default([]),
  accountId: z.string().nullish(),
})

const updateSchema = z.object({
  name: z.string().optional(),
  permissions: permissionsSchema.optional(),
  active: z.boolean().optional(),
  password: z.string().optional(),
})

const listQuery = z.object({ accountId: z.string().optional() })
const idParams = z.object({ id: z.string().min(1) })

export async function listUsers(request: FastifyRequest): Promise<UserResponse[]> {
  const { accountId } = listQuery.parse(request.query)
  const users = await makeListUsersUseCase().execute({ actor: request.user, accountId })
  return users.map(presentUser)
}

export async function createUser(request: FastifyRequest, reply: FastifyReply): Promise<UserResponse> {
  const body = createSchema.parse(request.body)
  const user = await makeCreateUserUseCase().execute({ actor: request.user, ...body })
  reply.status(201)
  return presentUser(user)
}

export async function updateUser(request: FastifyRequest): Promise<UserResponse> {
  const { id } = idParams.parse(request.params)
  const body = updateSchema.parse(request.body)
  const user = await makeUpdateUserUseCase().execute({ actor: request.user, userId: id, ...body })
  return presentUser(user)
}

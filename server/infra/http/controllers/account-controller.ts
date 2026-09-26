import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeCreateAccountUseCase, makeListAccountsUseCase, makeUpdateAccountUseCase } from '../../container'
import { presentAccount, presentUser, type AccountResponse, type UserResponse } from '../presenters'

const createSchema = z.object({
  name: z.string(),
  ownerName: z.string(),
  ownerEmail: z.email('E-mail inválido.'),
  ownerPassword: z.string(),
})

const updateSchema = z.object({
  name: z.string().optional(),
  active: z.boolean().optional(),
})

const idParams = z.object({ id: z.string().min(1) })

export async function listAccounts(request: FastifyRequest): Promise<AccountResponse[]> {
  const accounts = await makeListAccountsUseCase().execute({ actor: request.user })
  return accounts.map(presentAccount)
}

export async function createAccount(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<{ account: AccountResponse; owner: UserResponse }> {
  const body = createSchema.parse(request.body)
  const { account, owner } = await makeCreateAccountUseCase().execute({ actor: request.user, ...body })
  reply.status(201)
  return { account: presentAccount(account), owner: presentUser(owner) }
}

export async function updateAccount(request: FastifyRequest): Promise<AccountResponse> {
  const { id } = idParams.parse(request.params)
  const body = updateSchema.parse(request.body)
  const account = await makeUpdateAccountUseCase().execute({ actor: request.user, accountId: id, ...body })
  return presentAccount(account)
}

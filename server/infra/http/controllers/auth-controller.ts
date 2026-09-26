import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeChangePasswordUseCase, makeGetMeUseCase, makeLoginUseCase } from '../../container'
import { presentMe, type MeResponse } from '../presenters'
import { clearSessionCookie, setSessionCookie, toJwtPayload } from '../session'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.'),
  password: z.string().min(1, 'Informe a senha.'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z.string(),
})

export async function login(request: FastifyRequest, reply: FastifyReply): Promise<MeResponse> {
  const body = loginSchema.parse(request.body)
  const { user, account } = await makeLoginUseCase().execute(body)
  await setSessionCookie(reply, toJwtPayload(user, account))
  return presentMe(user, account)
}

export async function logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  clearSessionCookie(reply)
  await reply.status(204).send()
}

/** Relê do banco e renova o cookie (nome da loja, permissões e expiração ficam em dia) */
export async function me(request: FastifyRequest, reply: FastifyReply): Promise<MeResponse> {
  const { user, account } = await makeGetMeUseCase().execute({ userId: request.user.id })
  await setSessionCookie(reply, toJwtPayload(user, account))
  return presentMe(user, account)
}

export async function changePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = changePasswordSchema.parse(request.body)
  await makeChangePasswordUseCase().execute({ userId: request.user.id, ...body })
  await reply.status(204).send()
}

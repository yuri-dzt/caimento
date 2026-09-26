import type { FastifyReply, FastifyRequest, preHandlerAsyncHookHandler } from 'fastify'
import { can, isPlatformAdmin } from '../../../app/policies/permissions'
import type { Permission } from '../../../domain/enums/permission'

const FORBIDDEN = { message: 'Você não tem permissão para esta ação.', code: 'FORBIDDEN' }

export function requirePermission(permission: Permission): preHandlerAsyncHookHandler {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!can(request.user, permission)) await reply.status(403).send(FORBIDDEN)
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isPlatformAdmin(request.user)) await reply.status(403).send(FORBIDDEN)
}

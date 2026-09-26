import type { FastifyReply, FastifyRequest } from 'fastify'

/** onRequest: valida o JWT do cookie de sessão (assinatura + exp) e injeta request.user */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    await reply.status(401).send({ message: 'Sessão expirada. Entre novamente.', code: 'UNAUTHORIZED' })
  }
}

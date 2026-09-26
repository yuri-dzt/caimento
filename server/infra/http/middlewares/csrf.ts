import type { FastifyReply, FastifyRequest } from 'fastify'
import { CSRF_HEADER, CSRF_HEADER_VALUE } from '../session'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Proteção CSRF: toda escrita em /api exige o header customizado. Formulário de
 * outro site não consegue enviar header customizado sem preflight de CORS.
 */
export async function csrfMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (SAFE_METHODS.has(request.method) || !request.url.startsWith('/api/')) return
  if (request.headers[CSRF_HEADER] !== CSRF_HEADER_VALUE) {
    await reply.status(403).send({ message: 'Requisição bloqueada.', code: 'CSRF' })
  }
}

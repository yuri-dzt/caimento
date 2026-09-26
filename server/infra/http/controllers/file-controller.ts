import type { FastifyReply, FastifyRequest } from 'fastify'
import { logError } from '../../../app/shared/log'
import { env } from '../../config/env'
import { fileSigner, storage } from '../../container'
import { isServableKey } from '../signing'

interface FileRequest {
  Params: { '*': string }
  Querystring: { exp?: string; sig?: string }
}

/** Serve arquivo do MinIO por stream. Acesso pela assinatura HMAC (sem cookie). */
export async function serveFile(request: FastifyRequest<FileRequest>, reply: FastifyReply): Promise<void> {
  const key = decodeURIComponent(request.params['*'] ?? '')
  const { exp, sig } = request.query

  if (!isServableKey(key) || !fileSigner.verify(key, exp, sig)) {
    await reply.status(403).send({ message: 'Link de arquivo inválido ou expirado.', code: 'FORBIDDEN' })
    return
  }

  try {
    const object = await storage.getObject(key)
    await reply
      .header('Content-Type', object.mimeType)
      .header('Content-Length', object.size)
      .header('Cache-Control', `private, max-age=${env.FILE_URL_TTL_SECONDS}`)
      .header('X-Content-Type-Options', 'nosniff')
      .send(object.stream)
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === 'NoSuchKey' || code === 'NotFound') {
      await reply.status(404).send({ message: 'Arquivo não encontrado.', code: 'NOT_FOUND' })
      return
    }
    logError('serveFile', { key }, error)
    throw error
  }
}

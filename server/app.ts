import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { z, ZodError } from 'zod'
import { logError } from './app/shared/log'
import { AppError } from './domain/errors/app-error'
import { env, isProduction } from './infra/config/env'
import { csrfMiddleware } from './infra/http/middlewares/csrf'
import { apiRoutes } from './infra/http/routes'
import { formatAuthUser, SESSION_COOKIE } from './infra/http/session'

// mensagens padrão do zod em português
z.config(z.locales.pt())

/** Mapeia erros para respostas HTTP com mensagem em português */
function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message, code: error.code })
    }

    if (error instanceof ZodError) {
      const issue = error.issues[0]
      const field = issue?.path.join('.')
      const message = issue ? (field ? `${field}: ${issue.message}` : issue.message) : 'Dados inválidos.'
      return reply.status(400).send({ message, code: 'VALIDATION_ERROR' })
    }

    const fastifyError = error as FastifyError
    if (fastifyError.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply
        .status(413)
        .send({ message: `A imagem passa do limite de ${env.MAX_UPLOAD_MB} MB.`, code: 'FILE_TOO_LARGE' })
    }
    if (fastifyError.statusCode === 429) {
      return reply
        .status(429)
        .send({ message: 'Muitas tentativas. Aguarde um minuto e tente de novo.', code: 'RATE_LIMITED' })
    }
    if (fastifyError.statusCode && fastifyError.statusCode < 500) {
      return reply.status(fastifyError.statusCode).send({ message: 'Requisição inválida.', code: fastifyError.code })
    }

    logError('errorHandler', { method: request.method, url: request.url }, error)
    return reply.status(500).send({ message: 'Erro interno. Tente novamente.', code: 'INTERNAL_ERROR' })
  })
}

/** Em produção, serve o build do Vite (dist/client) com fallback de SPA */
async function registerClient(app: FastifyInstance): Promise<void> {
  const clientDir = path.resolve(__dirname, '..', 'client')
  const hasClient = existsSync(path.join(clientDir, 'index.html'))

  if (hasClient) {
    await app.register(fastifyStatic, {
      root: clientDir,
      wildcard: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.header('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    })
  }

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/') || request.method !== 'GET' || !hasClient) {
      return reply.status(404).send({ message: 'Rota não encontrada.', code: 'NOT_FOUND' })
    }
    return reply.header('Cache-Control', 'no-cache').sendFile('index.html')
  })
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: isProduction ? 'info' : 'warn' },
    trustProxy: true,
    bodyLimit: 1024 * 1024,
  })

  registerErrorHandler(app)

  if (env.CORS_ORIGIN) {
    await app.register(cors, { origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()), credentials: true })
  }

  await app.register(cookie)
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: SESSION_COOKIE, signed: false },
    sign: { algorithm: 'HS256' },
    verify: { algorithms: ['HS256'] },
    formatUser: formatAuthUser,
  })
  await app.register(rateLimit, { global: false })
  await app.register(multipart, {
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 3, fields: 20 },
    throwFileSizeLimit: true,
  })

  app.addHook('onRequest', csrfMiddleware)

  await app.register(apiRoutes, { prefix: '/api' })
  await registerClient(app)

  return app
}

import { buildApp } from './app'
import { logError } from './app/shared/log'
import { env } from './infra/config/env'
import { prisma } from './infra/config/prisma'
import { imageProvider, makeRecoverSimulationsUseCase, storage } from './infra/container'

async function bootstrap(): Promise<void> {
  const app = await buildApp()

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  console.info(`[server] Caimento rodando na porta ${env.PORT}`)

  if (!storage.isConfigured()) console.warn('[server] MinIO não configurado: uploads vão falhar.')
  if (!imageProvider.isConfigured()) {
    console.warn(`[server] Chave da IA (${imageProvider.name}) vazia: simulações ficam bloqueadas.`)
  }

  try {
    const recovered = await makeRecoverSimulationsUseCase().execute()
    if (recovered > 0) console.info(`[server] ${recovered} simulação(ões) pendente(s) reenfileirada(s).`)
  } catch (error) {
    logError('bootstrap.recoverSimulations', {}, error)
  }

  const shutdown = async (signal: string): Promise<void> => {
    console.info(`[server] ${signal} recebido, encerrando...`)
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

bootstrap().catch((error: unknown) => {
  logError('bootstrap', { port: env.PORT }, error)
  process.exit(1)
})

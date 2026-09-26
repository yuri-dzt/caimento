import type { FastifyInstance } from 'fastify'
import { Permission } from '../../../domain/enums/permission'
import * as accounts from '../controllers/account-controller'
import * as auth from '../controllers/auth-controller'
import * as customers from '../controllers/customer-controller'
import * as fabrics from '../controllers/fabric-controller'
import { serveFile } from '../controllers/file-controller'
import * as garments from '../controllers/garment-controller'
import * as simulations from '../controllers/simulation-controller'
import * as users from '../controllers/user-controller'
import { authMiddleware } from '../middlewares/auth'
import { requireAdmin, requirePermission } from '../middlewares/permission'

const view = requirePermission(Permission.VIEW)
const create = requirePermission(Permission.CREATE)
const edit = requirePermission(Permission.EDIT)
const remove = requirePermission(Permission.DELETE)

/** Rotas públicas: health, login, arquivos assinados */
async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok' }))

  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, auth.login)
  app.post('/auth/logout', auth.logout)

  app.get('/files/*', serveFile)
}

/** Rotas autenticadas (cookie de sessão) */
async function protectedRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authMiddleware)

  app.get('/me', auth.me)
  app.patch('/me/password', auth.changePassword)

  // lojas: só admin da plataforma
  app.get('/accounts', { preHandler: requireAdmin }, accounts.listAccounts)
  app.post('/accounts', { preHandler: requireAdmin }, accounts.createAccount)
  app.patch('/accounts/:id', { preHandler: requireAdmin }, accounts.updateAccount)

  // usuários: regra de admin/dona fica no use-case
  app.get('/users', users.listUsers)
  app.post('/users', users.createUser)
  app.patch('/users/:id', users.updateUser)

  app.get('/garments', { preHandler: view }, garments.listGarments)
  app.post('/garments', { preHandler: create }, garments.createGarment)
  app.delete('/garments/:id', { preHandler: remove }, garments.deleteGarment)

  app.get('/fabrics', { preHandler: view }, fabrics.listFabrics)
  app.post('/fabrics', { preHandler: create }, fabrics.createFabric)
  app.delete('/fabrics/:id', { preHandler: remove }, fabrics.deleteFabric)

  app.get('/customers', { preHandler: view }, customers.listCustomers)
  app.post('/customers', { preHandler: create }, customers.createCustomer)
  app.put('/customers/:id/photo', { preHandler: edit }, customers.updateCustomerPhoto)
  app.delete('/customers/:id', { preHandler: remove }, customers.deleteCustomer)

  app.get('/simulations', { preHandler: view }, simulations.listSimulations)
  app.get('/simulations/:id', { preHandler: view }, simulations.getSimulation)
  app.post('/simulations', { preHandler: create }, simulations.createSimulation)
  app.delete('/simulations/:id', { preHandler: remove }, simulations.deleteSimulation)
}

export async function apiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(publicRoutes)
  await app.register(protectedRoutes)
}

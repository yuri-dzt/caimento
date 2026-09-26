import { PrismaClient } from '../../generated/prisma'
import { isProduction } from './env'

export const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['warn', 'error'],
})

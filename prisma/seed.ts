// Cria o primeiro admin da plataforma. Idempotente: se o e-mail já existe, não faz nada.
// Uso: npm run prisma:seed
import { PrismaClient } from '../server/generated/prisma'
import { ScryptPasswordHasher } from '../server/infra/services/scrypt-password-hasher'

async function main(): Promise<void> {
  const name = process.env.ADMIN_NAME?.trim() || 'Administrador'
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD ?? ''

  if (!email) throw new Error('Defina ADMIN_EMAIL no .env')
  if (password.length < 8) throw new Error('ADMIN_PASSWORD precisa ter pelo menos 8 caracteres')

  const prisma = new PrismaClient()
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      console.info(`[seed] Admin ${email} já existe, nada a fazer.`)
      return
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await new ScryptPasswordHasher().hash(password),
        accountType: 'ADMIN',
        role: 'view,create,edit,delete',
        accountId: null,
      },
    })
    console.info(`[seed] Admin ${email} criado.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error('[seed] Falhou:', error instanceof Error ? error.message : error)
  process.exit(1)
})

import { createFileSigner, isServableKey } from '../../server/infra/http/signing'
import { durationToSeconds } from '../../server/infra/http/session'
import { InProcessJobQueue } from '../../server/infra/services/in-process-job-queue'
import { ScryptPasswordHasher } from '../../server/infra/services/scrypt-password-hasher'

vi.mock('../../server/infra/config/env', () => ({
  env: { JWT_EXPIRES_IN: '7d' },
  isProduction: false,
}))

describe('ScryptPasswordHasher', () => {
  const hasher = new ScryptPasswordHasher()

  it('gera hash com salt aleatório e valida a senha certa', async () => {
    const first = await hasher.hash('minha-senha')
    const second = await hasher.hash('minha-senha')

    expect(first).toMatch(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/)
    expect(first).not.toBe(second)
    expect(await hasher.verify('minha-senha', first)).toBe(true)
    expect(await hasher.verify('outra', first)).toBe(false)
  })

  it('hash em formato inválido nunca valida', async () => {
    expect(await hasher.verify('x', 'plain-text')).toBe(false)
  })
})

describe('file signer', () => {
  const now = 1_790_000_000_000
  const signer = createFileSigner('s'.repeat(32), 3600, () => now)

  function parse(url: string): { key: string; exp: string; sig: string } {
    const parsed = new URL(url, 'http://x')
    return {
      key: decodeURIComponent(parsed.pathname.replace('/api/files/', '')),
      exp: parsed.searchParams.get('exp') ?? '',
      sig: parsed.searchParams.get('sig') ?? '',
    }
  }

  it('URL assinada valida para a mesma chave', () => {
    const { key, exp, sig } = parse(signer.sign('fabrics/acc-1/a.png'))
    expect(key).toBe('fabrics/acc-1/a.png')
    expect(signer.verify(key, exp, sig)).toBe(true)
  })

  it('não vale para outra chave nem depois de expirar', () => {
    const { exp, sig } = parse(signer.sign('fabrics/acc-1/a.png'))
    expect(signer.verify('fabrics/acc-2/a.png', exp, sig)).toBe(false)

    const later = createFileSigner('s'.repeat(32), 3600, () => Number(exp) * 1000 + 1)
    expect(later.verify('fabrics/acc-1/a.png', exp, sig)).toBe(false)
  })

  it('só serve pastas liberadas e bloqueia path traversal', () => {
    expect(isServableKey('simulations/acc/x.png')).toBe(true)
    expect(isServableKey('backups/db.sql')).toBe(false)
    expect(isServableKey('fabrics/../backups/db.sql')).toBe(false)
  })
})

describe('durationToSeconds', () => {
  it('converte unidades', () => {
    expect(durationToSeconds('7d')).toBe(604800)
    expect(durationToSeconds('12h')).toBe(43200)
    expect(durationToSeconds('90')).toBe(90)
    expect(() => durationToSeconds('abc')).toThrow()
  })
})

describe('InProcessJobQueue', () => {
  it('respeita a concorrência e ignora id duplicado na fila', async () => {
    const queue = new InProcessJobQueue(1)
    const started: string[] = []
    const releases: Array<() => void> = []
    queue.setHandler(
      (id) =>
        new Promise<void>((resolve) => {
          started.push(id)
          releases.push(resolve)
        }),
    )

    queue.enqueue('a')
    queue.enqueue('b')
    queue.enqueue('b')
    expect(started).toEqual(['a'])

    releases[0]()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(started).toEqual(['a', 'b'])
    expect(queue.size.waiting).toBe(0)
  })
})

import { createHmac, timingSafeEqual } from 'node:crypto'

/** Pastas que podem ser servidas ao navegador via /api/files */
export const SERVABLE_PREFIXES = ['garments/', 'fabrics/', 'customers/', 'simulations/'] as const

export interface FileSigner {
  sign(key: string): string
  verify(key: string, exp: string | undefined, sig: string | undefined): boolean
}

export function isServableKey(key: string): boolean {
  if (key.includes('..') || key.startsWith('/')) return false
  return SERVABLE_PREFIXES.some((prefix) => key.startsWith(prefix))
}

export function createFileSigner(secret: string, ttlSeconds: number, now: () => number = Date.now): FileSigner {
  const signature = (key: string, exp: number): string =>
    createHmac('sha256', secret).update(`${key}:${exp}`).digest('hex')

  return {
    sign(key) {
      // arredonda a expiração para a URL ficar estável e o navegador aproveitar o cache
      const bucket = Math.max(60, Math.floor(ttlSeconds / 4))
      const exp = (Math.floor(now() / 1000 / bucket) + 1) * bucket + ttlSeconds
      const encodedKey = key.split('/').map(encodeURIComponent).join('/')
      return `/api/files/${encodedKey}?exp=${exp}&sig=${signature(key, exp)}`
    },
    verify(key, exp, sig) {
      if (!exp || !sig || !/^\d+$/.test(exp) || !/^[a-f0-9]{64}$/.test(sig)) return false
      const expNumber = Number(exp)
      if (expNumber * 1000 < now()) return false
      const expected = Buffer.from(signature(key, expNumber), 'hex')
      const received = Buffer.from(sig, 'hex')
      return expected.length === received.length && timingSafeEqual(expected, received)
    },
  }
}

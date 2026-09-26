import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'
import type { IPasswordHasher } from '../../contracts/services/password-hasher'

const KEY_LENGTH = 64
const SALT_BYTES = 16
// custo padrão recomendado (N=2^15, r=8, p=1): ~50ms por hash
const OPTIONS: ScryptOptions = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, OPTIONS, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

/** Formato: scrypt$<salt hex>$<hash hex> */
export class ScryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES)
    const key = await derive(plain, salt)
    return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [algorithm, saltHex, hashHex] = stored.split('$')
    if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false

    const expected = Buffer.from(hashHex, 'hex')
    const actual = await derive(plain, Buffer.from(saltHex, 'hex'))
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  }
}

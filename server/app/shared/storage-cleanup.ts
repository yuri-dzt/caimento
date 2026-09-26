import type { IStorageProvider } from '../../contracts/storage'
import { logError } from './log'

/** Apaga arquivos do storage sem derrubar a operação (best-effort, com log) */
export async function deleteFilesSafely(storage: IStorageProvider, keys: Array<string | null | undefined>): Promise<void> {
  const validKeys = keys.filter((key): key is string => Boolean(key))
  await Promise.all(
    validKeys.map(async (key) => {
      try {
        await storage.delete(key)
      } catch (error) {
        logError('deleteFilesSafely', { key }, error)
      }
    }),
  )
}

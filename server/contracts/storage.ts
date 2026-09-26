import type { Readable } from 'node:stream'

export interface UploadInput {
  key: string
  buffer: Buffer
  mimeType: string
}

export interface StoredObject {
  stream: Readable
  mimeType: string
  size: number
}

export interface IStorageProvider {
  isConfigured(): boolean
  upload(input: UploadInput): Promise<void>
  /** Baixa o arquivo inteiro em memória (uso interno, ex.: mandar para a IA) */
  download(key: string): Promise<Buffer>
  /** Stream para servir ao navegador */
  getObject(key: string): Promise<StoredObject>
  delete(key: string): Promise<void>
  /** URL same-origin assinada (/api/files/<key>?exp=&sig=) */
  fileUrl(key: string): string
}

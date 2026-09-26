import type { Client } from 'minio'
import { logError } from '../../app/shared/log'
import type { IStorageProvider, StoredObject, UploadInput } from '../../contracts/storage'
import { ServiceUnavailableError } from '../../domain/errors/app-error'
import type { FileSigner } from '../http/signing'

export class MinioStorageProvider implements IStorageProvider {
  private bucketReady: Promise<void> | null = null

  constructor(
    private readonly client: Client | null,
    private readonly bucket: string,
    private readonly signer: FileSigner,
    private readonly region: string,
  ) {}

  isConfigured(): boolean {
    return this.client !== null
  }

  async upload(input: UploadInput): Promise<void> {
    const client = await this.ready()
    try {
      await client.putObject(this.bucket, input.key, input.buffer, input.buffer.length, {
        'Content-Type': input.mimeType,
      })
    } catch (error) {
      throw toStorageError('MinioStorageProvider.upload', { key: input.key }, error)
    }
  }

  async download(key: string): Promise<Buffer> {
    const client = await this.ready()
    const stream = await client.getObject(this.bucket, key)
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    return Buffer.concat(chunks)
  }

  async getObject(key: string): Promise<StoredObject> {
    const client = await this.ready()
    const stat = await client.statObject(this.bucket, key)
    const stream = await client.getObject(this.bucket, key)
    const metaData = stat.metaData as Record<string, string | undefined>
    return {
      stream,
      size: stat.size,
      mimeType: metaData['content-type'] ?? 'application/octet-stream',
    }
  }

  async delete(key: string): Promise<void> {
    const client = await this.ready()
    await client.removeObject(this.bucket, key)
  }

  fileUrl(key: string): string {
    return this.signer.sign(key)
  }

  /** Cria o bucket na primeira operação, se não existir */
  private async ready(): Promise<Client> {
    const client = this.client
    if (!client) throw new ServiceUnavailableError('O armazenamento de imagens não está configurado.')

    this.bucketReady ??= (async () => {
      const exists = await client.bucketExists(this.bucket)
      if (!exists) await client.makeBucket(this.bucket, this.region)
    })().catch((error: unknown) => {
      this.bucketReady = null
      throw toStorageError('MinioStorageProvider.ready', { bucket: this.bucket }, error)
    })

    await this.bucketReady
    return client
  }
}

// falhas de conexão/credencial viram 503 com mensagem clara (o detalhe fica no log)
const UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EAI_AGAIN',
  'AccessDenied',
  'InvalidAccessKeyId',
  'SignatureDoesNotMatch',
])

function toStorageError(context: string, params: Record<string, unknown>, error: unknown): unknown {
  if (error instanceof ServiceUnavailableError) return error
  logError(context, params, error)
  const code = (error as { code?: string }).code ?? ''
  if (UNAVAILABLE_CODES.has(code)) {
    return new ServiceUnavailableError('Não foi possível salvar a imagem: o armazenamento está fora do ar ou mal configurado.')
  }
  return error
}

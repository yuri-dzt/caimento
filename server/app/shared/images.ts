import { randomUUID } from 'node:crypto'
import { ValidationError } from '../../domain/errors/app-error'

export interface ImageFile {
  buffer: Buffer
  mimeType: string
}

export const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const StorageFolder = {
  GARMENTS: 'garments',
  FABRICS: 'fabrics',
  CUSTOMERS: 'customers',
  SIMULATIONS: 'simulations',
} as const

export type StorageFolder = (typeof StorageFolder)[keyof typeof StorageFolder]

export function assertValidImage(image: ImageFile): void {
  if (!IMAGE_EXTENSIONS[image.mimeType]) {
    throw new ValidationError('Formato de imagem não suportado. Use JPG, PNG ou WEBP.')
  }
  if (image.buffer.length === 0) {
    throw new ValidationError('A imagem enviada está vazia.')
  }
}

export function extensionFor(mimeType: string): string {
  return IMAGE_EXTENSIONS[mimeType] ?? 'bin'
}

export function buildFileKey(folder: StorageFolder, accountId: string, mimeType: string, id: string = randomUUID()): string {
  return `${folder}/${accountId}/${id}.${extensionFor(mimeType)}`
}

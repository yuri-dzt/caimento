import type { FastifyRequest } from 'fastify'
import type { ImageFile } from '../../app/shared/images'
import { ValidationError } from '../../domain/errors/app-error'

export interface MultipartData {
  fields: Record<string, string>
  files: Record<string, ImageFile>
}

/** Lê o multipart inteiro (campos + arquivos em memória). Limites no registro do plugin. */
export async function readMultipart(request: FastifyRequest): Promise<MultipartData> {
  if (!request.isMultipart()) throw new ValidationError('Envie o formulário como multipart/form-data.')

  const fields: Record<string, string> = {}
  const files: Record<string, ImageFile> = {}

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      const buffer = await part.toBuffer()
      if (buffer.length > 0) files[part.fieldname] = { buffer, mimeType: part.mimetype }
    } else if (typeof part.value === 'string') {
      fields[part.fieldname] = part.value
    }
  }

  return { fields, files }
}

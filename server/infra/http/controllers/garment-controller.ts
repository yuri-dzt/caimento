import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { ValidationError } from '../../../domain/errors/app-error'
import { makeCreateGarmentUseCase, makeDeleteGarmentUseCase, makeListGarmentsUseCase, storage } from '../../container'
import { readMultipart } from '../multipart'
import { makePresenters } from '../presenters'

const present = makePresenters(storage)
type GarmentResponse = ReturnType<typeof present.garment>

const createFields = z.object({
  name: z.string(),
  description: z.string().optional(),
})

const idParams = z.object({ id: z.string().min(1) })

export async function listGarments(request: FastifyRequest): Promise<GarmentResponse[]> {
  const garments = await makeListGarmentsUseCase().execute({ actor: request.user })
  return garments.map(present.garment)
}

export async function createGarment(request: FastifyRequest, reply: FastifyReply): Promise<GarmentResponse> {
  const { fields, files } = await readMultipart(request)
  const data = createFields.parse(fields)
  if (!files.image) throw new ValidationError('Envie a foto da peça.')

  const garment = await makeCreateGarmentUseCase().execute({ actor: request.user, ...data, image: files.image })
  reply.status(201)
  return present.garment(garment)
}

export async function deleteGarment(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = idParams.parse(request.params)
  await makeDeleteGarmentUseCase().execute({ actor: request.user, garmentId: id })
  await reply.status(204).send()
}

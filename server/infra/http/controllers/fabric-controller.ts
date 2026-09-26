import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { FABRIC_TYPES } from '../../../domain/enums/fabric-type'
import { ValidationError } from '../../../domain/errors/app-error'
import { makeCreateFabricUseCase, makeDeleteFabricUseCase, makeListFabricsUseCase, storage } from '../../container'
import { readMultipart } from '../multipart'
import { makePresenters } from '../presenters'

const present = makePresenters(storage)
type FabricResponse = ReturnType<typeof present.fabric>

const createFields = z.object({
  name: z.string(),
  fabricType: z.enum(FABRIC_TYPES, 'Escolha o tipo de tecido.'),
  description: z.string().optional(),
})

const idParams = z.object({ id: z.string().min(1) })

export async function listFabrics(request: FastifyRequest): Promise<FabricResponse[]> {
  const fabrics = await makeListFabricsUseCase().execute({ actor: request.user })
  return fabrics.map(present.fabric)
}

export async function createFabric(request: FastifyRequest, reply: FastifyReply): Promise<FabricResponse> {
  const { fields, files } = await readMultipart(request)
  const data = createFields.parse(fields)
  if (!files.image) throw new ValidationError('Envie a foto do tecido.')

  const fabric = await makeCreateFabricUseCase().execute({ actor: request.user, ...data, image: files.image })
  reply.status(201)
  return present.fabric(fabric)
}

export async function deleteFabric(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = idParams.parse(request.params)
  await makeDeleteFabricUseCase().execute({ actor: request.user, fabricId: id })
  await reply.status(204).send()
}

import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { SimulationType } from '../../../domain/enums/simulation'
import {
  makeCreateSimulationUseCase,
  makeDeleteSimulationUseCase,
  makeGetSimulationUseCase,
  makeListSimulationsUseCase,
  storage,
} from '../../container'
import { makePresenters } from '../presenters'

const present = makePresenters(storage)
type SimulationResponse = ReturnType<typeof present.simulation>

const simulationType = z.enum([SimulationType.FABRIC_SWAP, SimulationType.TRY_ON])

const createSchema = z.object({
  type: simulationType,
  garmentId: z.string().nullish(),
  fabricId: z.string().nullish(),
  customerId: z.string().nullish(),
  sourceSimulationId: z.string().nullish(),
  instructions: z.string().nullish(),
})

const listQuery = z.object({
  customerId: z.string().optional(),
  type: simulationType.optional(),
  limit: z.coerce.number().int().positive().optional(),
})

const idParams = z.object({ id: z.string().min(1) })

export async function listSimulations(request: FastifyRequest): Promise<SimulationResponse[]> {
  const query = listQuery.parse(request.query)
  const simulations = await makeListSimulationsUseCase().execute({ actor: request.user, ...query })
  return simulations.map(present.simulation)
}

export async function getSimulation(request: FastifyRequest): Promise<SimulationResponse> {
  const { id } = idParams.parse(request.params)
  const simulation = await makeGetSimulationUseCase().execute({ actor: request.user, simulationId: id })
  return present.simulation(simulation)
}

export async function createSimulation(request: FastifyRequest, reply: FastifyReply): Promise<SimulationResponse> {
  const body = createSchema.parse(request.body)
  const created = await makeCreateSimulationUseCase().execute({ actor: request.user, ...body })
  const simulation = await makeGetSimulationUseCase().execute({ actor: request.user, simulationId: created.id })
  reply.status(201)
  return present.simulation(simulation)
}

export async function deleteSimulation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = idParams.parse(request.params)
  await makeDeleteSimulationUseCase().execute({ actor: request.user, simulationId: id })
  await reply.status(204).send()
}

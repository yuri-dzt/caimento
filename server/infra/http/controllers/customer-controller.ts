import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { ValidationError } from '../../../domain/errors/app-error'
import {
  makeCreateCustomerUseCase,
  makeDeleteCustomerUseCase,
  makeListCustomersUseCase,
  makeUpdateCustomerPhotoUseCase,
  storage,
} from '../../container'
import { readMultipart } from '../multipart'
import { makePresenters } from '../presenters'

const present = makePresenters(storage)
type CustomerResponse = ReturnType<typeof present.customer>

const consentField = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true')

const createFields = z.object({
  name: z.string(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  photoConsent: consentField,
})

const photoFields = z.object({ photoConsent: consentField })
const idParams = z.object({ id: z.string().min(1) })

export async function listCustomers(request: FastifyRequest): Promise<CustomerResponse[]> {
  const customers = await makeListCustomersUseCase().execute({ actor: request.user })
  return customers.map(present.customer)
}

export async function createCustomer(request: FastifyRequest, reply: FastifyReply): Promise<CustomerResponse> {
  const { fields, files } = await readMultipart(request)
  const data = createFields.parse(fields)

  const customer = await makeCreateCustomerUseCase().execute({
    actor: request.user,
    ...data,
    photo: files.photo ?? null,
  })
  reply.status(201)
  return present.customer(customer)
}

export async function updateCustomerPhoto(request: FastifyRequest): Promise<CustomerResponse> {
  const { id } = idParams.parse(request.params)
  const { fields, files } = await readMultipart(request)
  const data = photoFields.parse(fields)
  if (!files.photo) throw new ValidationError('Envie a foto da cliente.')

  const customer = await makeUpdateCustomerPhotoUseCase().execute({
    actor: request.user,
    customerId: id,
    photo: files.photo,
    photoConsent: data.photoConsent,
  })
  return present.customer(customer)
}

export async function deleteCustomer(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = idParams.parse(request.params)
  await makeDeleteCustomerUseCase().execute({ actor: request.user, customerId: id })
  await reply.status(204).send()
}

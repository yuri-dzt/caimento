import type {
  Account,
  AccountType,
  Customer,
  Fabric,
  FabricType,
  Garment,
  Me,
  Permission,
  Simulation,
  SimulationType,
  User,
} from '../types/api'
import { api } from './api'

export const authApi = {
  me: () => api.get<Me>('/me', { skipAuthRedirect: true }),
  login: (email: string, password: string) => api.post<Me>('/auth/login', { email, password }),
  logout: () => api.post<void>('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<void>('/me/password', { currentPassword, newPassword }),
}

export const garmentsApi = {
  list: () => api.get<Garment[]>('/garments'),
  create: (input: { name: string; description?: string; image: Blob }) => {
    const form = new FormData()
    form.append('name', input.name)
    if (input.description) form.append('description', input.description)
    form.append('image', input.image, 'garment.jpg')
    return api.post<Garment>('/garments', form)
  },
  remove: (id: string) => api.delete(`/garments/${id}`),
}

export const fabricsApi = {
  list: () => api.get<Fabric[]>('/fabrics'),
  create: (input: { name: string; fabricType: FabricType; description?: string; image: Blob }) => {
    const form = new FormData()
    form.append('name', input.name)
    form.append('fabricType', input.fabricType)
    if (input.description) form.append('description', input.description)
    form.append('image', input.image, 'fabric.jpg')
    return api.post<Fabric>('/fabrics', form)
  },
  remove: (id: string) => api.delete(`/fabrics/${id}`),
}

export const customersApi = {
  list: () => api.get<Customer[]>('/customers'),
  create: (input: { name: string; phone?: string; notes?: string; photo?: Blob | null; photoConsent: boolean }) => {
    const form = new FormData()
    form.append('name', input.name)
    if (input.phone) form.append('phone', input.phone)
    if (input.notes) form.append('notes', input.notes)
    form.append('photoConsent', String(input.photoConsent))
    if (input.photo) form.append('photo', input.photo, 'customer.jpg')
    return api.post<Customer>('/customers', form)
  },
  updatePhoto: (id: string, photo: Blob, photoConsent: boolean) => {
    const form = new FormData()
    form.append('photoConsent', String(photoConsent))
    form.append('photo', photo, 'customer.jpg')
    return api.put<Customer>(`/customers/${id}/photo`, form)
  },
  remove: (id: string) => api.delete(`/customers/${id}`),
}

export interface CreateSimulationInput {
  type: SimulationType
  garmentId?: string | null
  fabricId?: string | null
  customerId?: string | null
  sourceSimulationId?: string | null
  instructions?: string | null
}

export const simulationsApi = {
  list: (params: { type?: SimulationType; customerId?: string } = {}) => {
    const query = new URLSearchParams()
    if (params.type) query.set('type', params.type)
    if (params.customerId) query.set('customerId', params.customerId)
    const qs = query.toString()
    return api.get<Simulation[]>(`/simulations${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) => api.get<Simulation>(`/simulations/${id}`),
  create: (input: CreateSimulationInput) => api.post<Simulation>('/simulations', input),
  remove: (id: string) => api.delete(`/simulations/${id}`),
}

export const usersApi = {
  list: (accountId?: string) => api.get<User[]>(`/users${accountId ? `?accountId=${accountId}` : ''}`),
  create: (input: {
    name: string
    email: string
    password: string
    accountType: AccountType
    permissions: Permission[]
    accountId?: string | null
  }) => api.post<User>('/users', input),
  update: (id: string, input: { name?: string; permissions?: Permission[]; active?: boolean; password?: string }) =>
    api.patch<User>(`/users/${id}`, input),
}

export const accountsApi = {
  list: () => api.get<Account[]>('/accounts'),
  create: (input: { name: string; ownerName: string; ownerEmail: string; ownerPassword: string }) =>
    api.post<{ account: Account; owner: User }>('/accounts', input),
  update: (id: string, input: { name?: string; active?: boolean }) => api.patch<Account>(`/accounts/${id}`, input),
}

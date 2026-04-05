import { api } from './client'

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  risk_score: number
  total_billed: number
  total_paid: number
}

export interface ClientCreate {
  name: string
  email?: string
  phone?: string
  company?: string
}

export const clientsApi = {
  list: () => api.get<Client[]>('/clients/'),
  get: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: ClientCreate) => api.post<Client>('/clients/', data),
  update: (id: string, data: Partial<ClientCreate>) => api.patch<Client>(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  risk: (id: string) => api.get(`/clients/${id}/risk`),
}
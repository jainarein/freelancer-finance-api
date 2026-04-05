import { api } from './client'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  user_id: string
  client_name: string
  client_email: string | null
  client_gstin: string | null
  invoice_number: string
  description: string | null
  due_date: string
  base_amount: number
  gst_rate: number
  gst_amount: number
  total_amount: number
  is_gst_applicable: boolean
  status: InvoiceStatus
  created_at: string
  updated_at: string
}

export interface InvoiceCreate {
  client_name: string
  client_email?: string
  client_gstin?: string
  description?: string
  due_date: string
  base_amount: number
}

export interface InvoiceUpdate {
  client_name?: string
  client_email?: string
  description?: string
  due_date?: string
  base_amount?: number
  status?: InvoiceStatus
}

export interface InvoiceSummary {
  total_invoices: number
  total_base_amount: number
  total_gst_amount: number
  total_amount: number
  paid_amount: number
  pending_amount: number
  overdue_amount: number
}

export const invoicesApi = {
  list: (status?: InvoiceStatus) => 
    api.get<Invoice[]>(`/invoices/${status ? `?status=${status}` : ''}`),
  
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  
  create: (data: InvoiceCreate) => api.post<Invoice>('/invoices/', data),
  
  update: (id: string, data: InvoiceUpdate) => api.patch<Invoice>(`/invoices/${id}`, data),
  
  delete: (id: string) => api.delete(`/invoices/${id}`),
  
  summary: () => api.get<InvoiceSummary>('/invoices/summary'),
  
  overdue: () => api.get<Invoice[]>('/invoices/overdue'),
}
import { api } from './client'

export interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  expense_date: string
  category: string
  is_tax_deductible: boolean
  gst_paid: number
  created_at: string
}

export interface ExpenseCreate {
  title: string
  description?: string
  amount: number
  expense_date: string
  gst_paid?: number
}

export const expensesApi = {
  list: (category?: string) => 
    api.get<Expense[]>(`/expenses/${category ? `?category=${category}` : ''}`),
  get: (id: string) => api.get<Expense>(`/expenses/${id}`),
  create: (data: ExpenseCreate) => api.post<Expense>('/expenses/', data),
  update: (id: string, data: Partial<ExpenseCreate>) => api.patch<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  summary: () => api.get('/expenses/summary'),
  taxEstimate: () => api.get('/expenses/tax-estimate'),
}
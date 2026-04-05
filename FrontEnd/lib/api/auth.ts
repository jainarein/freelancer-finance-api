import { api } from './client'

export interface User {
  id: string
  full_name: string
  email: string
  is_gst_registered: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<TokenResponse>('/auth/login', { email, password })
    localStorage.setItem('access_token', response.access_token)
    return response
  },
  
  signup: async (data: { full_name: string; email: string; password: string }) => {
    const response = await api.post<TokenResponse>('/auth/signup', data)
    localStorage.setItem('access_token', response.access_token)
    return response
  },
  
  me: () => api.get<User>('/auth/me'),
  
  logout: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/auth/login'
  },
  
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('access_token')
  },
}
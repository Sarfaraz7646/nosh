import { apiRequest } from './apiClient'

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(credentials),
  }),
  register: (details) => apiRequest('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(details),
  }),
}

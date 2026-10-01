import { io } from 'socket.io-client'
import { API_ORIGIN } from './apiClient'

export function connectOrderSocket() {
  const token = localStorage.getItem('nosh-token') || localStorage.getItem('restaurant-token')
  if (!token) return null
  return io(API_ORIGIN, { auth: { token } })
}

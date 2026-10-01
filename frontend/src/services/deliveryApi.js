import { apiRequest } from './apiClient'

export const deliveryApi = {
  getProfile: () => apiRequest('/delivery/me'),
  updateProfile: (profile) => apiRequest('/delivery/me', { method: 'PUT', body: JSON.stringify(profile) }),
  getDashboard: () => apiRequest('/delivery/dashboard'),
  listOrders: () => apiRequest('/delivery/orders'),
  getEarnings: () => apiRequest('/delivery/earnings'),
  setOnline: (isOnline) => apiRequest('/delivery/status', { method: 'PATCH', body: JSON.stringify({ isOnline }) }),
  updateLocation: (coordinates) => apiRequest('/delivery/location', { method: 'PATCH', body: JSON.stringify({ coordinates }) }),
  acceptOrder: (orderId) => apiRequest(`/delivery/orders/${orderId}/accept`, { method: 'PUT' }),
  declineOrder: (orderId) => apiRequest(`/delivery/orders/${orderId}/decline`, { method: 'PUT' }),
  markPickedUp: (orderId) => apiRequest(`/delivery/orders/${orderId}/pickup`, { method: 'PUT' }),
  markDelivered: (orderId) => apiRequest(`/delivery/orders/${orderId}/deliver`, { method: 'PUT' }),
}

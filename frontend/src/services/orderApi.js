import { apiRequest } from './apiClient'
import { customerApi } from './customerApi'

export const orderApi = {
  async createOrder(order) {
    const result = await apiRequest('/orders', { method: 'POST', body: JSON.stringify(order) })
    return customerApi.mapOrder(result.order)
  },
  async listMine() {
    const result = await apiRequest('/orders/mine')
    return result.orders.map(customerApi.mapOrder)
  },
  async listRestaurant(restaurantId) {
    const path = restaurantId ? `/orders/restaurant/${restaurantId}` : '/orders/restaurant'
    const result = await apiRequest(path)
    return result.orders.map(customerApi.mapOrder)
  },
  async setStatus(orderId, orderStatus) {
    const result = await apiRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ orderStatus }),
    })
    return customerApi.mapOrder(result.order)
  },
  async accept(orderId) {
    const result = await apiRequest(`/orders/${orderId}/accept`, { method: 'PUT' })
    return customerApi.mapOrder(result.order)
  },
  async reject(orderId) {
    const result = await apiRequest(`/orders/${orderId}/reject`, { method: 'PUT' })
    return customerApi.mapOrder(result.order)
  },
}

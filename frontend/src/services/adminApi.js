import { apiRequest } from './apiClient'

export const adminApi = {
  async listDeliveryPartners(status = 'PENDING') {
    const result = await apiRequest(`/admin/delivery-partners?status=${encodeURIComponent(status)}`)
    return result.partners
  },
  async approveDeliveryPartner(id) {
    const result = await apiRequest(`/admin/delivery-partners/${id}/approve`, { method: 'PUT' })
    return result.partner
  },
  async rejectDeliveryPartner(id, reason) {
    const result = await apiRequest(`/admin/delivery-partners/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    })
    return result.partner
  },
}

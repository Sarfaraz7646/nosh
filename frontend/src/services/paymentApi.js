import { apiRequest } from './apiClient'

export const paymentApi = {
  createRazorpayOrder: (orderId) => apiRequest('/payments/razorpay/order', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  }),
  verifyRazorpayPayment: (details) => apiRequest('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(details),
  }),
}

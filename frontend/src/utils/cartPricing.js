export const DELIVERY_FEE = 40
export const TAX_RATE = 0.05

export function calculateCartTotals(items = []) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const deliveryFee = items.length ? DELIVERY_FEE : 0
  const tax = Math.floor(subtotal * TAX_RATE)

  return {
    subtotal,
    deliveryFee,
    tax,
    total: subtotal + deliveryFee + tax,
  }
}

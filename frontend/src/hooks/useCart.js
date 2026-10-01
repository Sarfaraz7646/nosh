import { useCustomer } from './useCustomer'
import { calculateCartTotals } from '../utils/cartPricing'

export function useCart() {
  const { cart, addToCart, changeQuantity, removeFromCart, clearCart } = useCustomer()
  const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0)
  const totals = calculateCartTotals(cart.items)

  return { cart, itemCount, ...totals, addToCart, changeQuantity, removeFromCart, clearCart }
}

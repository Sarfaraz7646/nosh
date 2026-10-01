import { useEffect, useState } from 'react'
import CustomerContext from './customerContext'
import { calculateCartTotals } from '../utils/cartPricing'
import { authApi } from '../services/authApi'
import { customerApi } from '../services/customerApi'
import { orderApi } from '../services/orderApi'
import { connectOrderSocket } from '../services/orderSocket'
import { restaurants as demoRestaurants } from '../services/catalog'

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function CustomerProvider({ children }) {
  const [user, setUser] = useState(() => readStorage('nosh-user', null))
  const [cart, setCart] = useState(() => readStorage('nosh-cart', { items: [] }))
  const [orders, setOrders] = useState(() => readStorage('nosh-orders', []))
  const [notifications, setNotifications] = useState(() => readStorage('nosh-notifications', []))
  const [favorites, setFavorites] = useState(() => readStorage('nosh-favorites', []))
  const [restaurants, setRestaurants] = useState(demoRestaurants)

  useEffect(() => localStorage.setItem('nosh-user', JSON.stringify(user)), [user])
  useEffect(() => localStorage.setItem('nosh-cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('nosh-orders', JSON.stringify(orders)), [orders])
  useEffect(() => localStorage.setItem('nosh-notifications', JSON.stringify(notifications)), [notifications])
  useEffect(() => localStorage.setItem('nosh-favorites', JSON.stringify(favorites)), [favorites])

  useEffect(() => {
    let active = true
    customerApi.listRestaurants()
      .then((result) => { if (active && result.length) setRestaurants(result) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user?.id || !localStorage.getItem('nosh-token')) return undefined
    let active = true
    if (user.role === 'CUSTOMER') {
      customerApi.listOrders()
        .then((result) => { if (active) setOrders(result) })
        .catch(() => {})
    }
    return () => { active = false }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (user?.role !== 'CUSTOMER' || !localStorage.getItem('nosh-token')) return undefined
    const socket = connectOrderSocket()
    const upsertOrder = (serverOrder) => {
      const order = customerApi.mapOrder(serverOrder)
      setOrders((current) => [order, ...current.filter((entry) => entry.id !== order.id)])
    }
    socket?.on('order:created', upsertOrder)
    socket?.on('order:updated', upsertOrder)
    socket?.on('delivery:accepted', (event) => {
      setOrders((current) => current.map((order) => String(order.id) === String(event.orderId)
        ? { ...order, deliveryPartnerName: event.partnerName, status: 'Delivery partner assigned' }
        : order))
    })
    socket?.on('delivery:location', (event) => {
      setOrders((current) => current.map((order) => String(order.id) === String(event.orderId)
        ? { ...order, deliveryLocation: event }
        : order))
    })
    socket?.on('notification:new', (notification) => {
      setNotifications((current) => [notification, ...current.filter((item) => item._id !== notification._id)].slice(0, 20))
    })
    return () => socket?.disconnect()
  }, [user?.id, user?.role])

  async function signIn({ name, email, password, role = 'CUSTOMER' }) {
    try {
      const result = name
        ? await authApi.register({ name, email, password, role })
        : await authApi.login({ email, password })
      localStorage.setItem('nosh-token', result.token)
      setUser(result.user)
      return result.user
    } catch (error) {
      if (error.status) throw error
    }

    const displayName = name?.trim() || email.split('@')[0]
    const localUser = { name: displayName, email: email.trim().toLowerCase(), role }
    setUser(localUser)
    return localUser
  }

  function signOut() {
    setUser(null)
    localStorage.removeItem('nosh-token')
  }

  function updateProfile(profile) {
    setUser((current) => ({ ...current, ...profile }))
  }

  function addToCart(item, restaurant) {
    setCart((current) => {
      const sameRestaurant = current.restaurantId === restaurant.id
      const items = sameRestaurant ? [...current.items] : []
      const existingIndex = items.findIndex((cartItem) => cartItem.id === item.id)

      if (existingIndex >= 0) {
        items[existingIndex] = { ...items[existingIndex], quantity: items[existingIndex].quantity + 1 }
      } else {
        items.push({ ...item, quantity: 1 })
      }

      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        items,
      }
    })
  }

  function changeQuantity(itemId, quantity) {
    setCart((current) => {
      const items = current.items
        .map((item) => (item.id === itemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
      return { ...current, items, ...(items.length ? {} : { restaurantId: null, restaurantName: null }) }
    })
  }

  function removeFromCart(itemId) {
    setCart((current) => {
      const items = current.items.filter((item) => item.id !== itemId)
      return { ...current, items, ...(items.length ? {} : { restaurantId: null, restaurantName: null }) }
    })
  }

  function clearCart() {
    setCart({ restaurantId: null, restaurantName: null, items: [] })
  }

  async function placeOrder({ address, paymentMethod }) {
    const totals = calculateCartTotals(cart.items)
    const token = localStorage.getItem('nosh-token')
    const requiresOnlinePayment = paymentMethod === 'UPI / card'
    let order

    if (token) {
      const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value))
      if (user?.role !== 'CUSTOMER') throw new Error('Sign in with a customer account to place an order.')
      if (!isObjectId(cart.restaurantId) || cart.items.some((item) => !isObjectId(item._id || item.id))) {
        throw new Error('Refresh the restaurant menu before placing this order.')
      }
      order = await orderApi.createOrder({
        restaurantId: cart.restaurantId,
        items: cart.items.map((item) => ({ menuItemId: item._id || item.id, quantity: item.quantity })),
        address: {
          recipientName: address.name,
          phone: address.phone,
          addressLine1: address.line1,
          addressLine2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.pincode,
          country: 'India',
          ...(address.location ? { location: address.location } : {}),
        },
        paymentMethod,
      })
      order = { ...order, restaurantName: cart.restaurantName }
    } else {
      if (requiresOnlinePayment) {
        throw new Error('Online payment requires a customer account connected to the backend.')
      }
      order = {
        id: `NS${Date.now().toString().slice(-8)}`,
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName,
        items: cart.items.map((item) => ({ ...item })),
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        tax: totals.tax,
        address,
        paymentMethod,
        totalAmount: totals.total,
        status: 'Placed',
        createdAt: new Date().toISOString(),
      }
    }

    if (!requiresOnlinePayment) completeOrder(order)
    return order
  }

  function completeOrder(order) {
    setOrders((current) => [order, ...current.filter((entry) => entry.id !== order.id)])
    clearCart()
    return order
  }

  function toggleFavorite(restaurantId) {
    setFavorites((current) =>
      current.includes(restaurantId)
        ? current.filter((id) => id !== restaurantId)
        : [...current, restaurantId],
    )
  }

  return (
    <CustomerContext.Provider
      value={{
        user,
        cart,
        orders,
        notifications,
        notifications,
        restaurants,
        favorites,
        signIn,
        signOut,
        updateProfile,
        addToCart,
        changeQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        completeOrder,
        toggleFavorite,
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

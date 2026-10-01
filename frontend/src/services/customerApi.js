import { apiRequest } from './apiClient'
import { orderStatusLabels } from '../utils/orderStatus'

function mapRestaurant(restaurant) {
  const address = restaurant.address
  return {
    ...restaurant,
    id: restaurant._id || restaurant.id,
    address: address && typeof address === 'object'
      ? [address.addressLine1, address.city, address.state].filter(Boolean).join(', ')
      : address || '',
    cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [],
    deliveryTime: restaurant.deliveryTime || '30–40 min',
    priceForTwo: restaurant.priceForTwo || 500,
    offer: restaurant.offer || 'Made fresh for you',
    menu: restaurant.menu || [],
  }
}

function mapMenuItem(item) {
  return { ...item, id: item._id || item.id, _id: item._id || item.id, isVeg: item.isVeg ?? true }
}

function mapOrder(order) {
  const restaurant = order.restaurantId
  const address = order.address || {}
  const restaurantAddress = typeof restaurant === 'object' ? restaurant?.address : null
  const orderStatus = order.orderStatus || order.status || 'PLACED'
  return {
    ...order,
    id: order._id || order.id,
    orderNumber: order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : order.id),
    restaurantId: typeof restaurant === 'object' ? restaurant?._id : restaurant,
    restaurantName: order.restaurantName || (typeof restaurant === 'object' ? restaurant?.name : '') || 'Restaurant',
    restaurantLocation: typeof restaurant === 'object' ? restaurant?.location || restaurantAddress?.location : order.restaurantLocation,
    restaurantAddress: restaurantAddress && typeof restaurantAddress === 'object'
      ? [restaurantAddress.addressLine1, restaurantAddress.city, restaurantAddress.state].filter(Boolean).join(', ')
      : '',
    items: (order.items || []).map((item) => ({ ...item, id: item.menuItemId?._id || item.menuItemId || item.id })),
    customer: typeof order.customerId === 'object' ? order.customerId?.name : undefined,
    total: order.totalAmount,
    time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
    status: orderStatusLabels[orderStatus] || orderStatus,
    address: {
      ...address,
      name: address.recipientName || address.name || '',
      line1: address.addressLine1 || address.line1 || '',
      line2: address.addressLine2 || address.line2 || '',
      pincode: address.postalCode || address.pincode || '',
    },
  }
}

export const customerApi = {
  async listRestaurants() {
    const { restaurants } = await apiRequest('/restaurants')
    return restaurants.map(mapRestaurant)
  },
  async getRestaurant(id) {
    const { restaurant } = await apiRequest(`/restaurants/${id}`)
    return mapRestaurant(restaurant)
  },
  async getMenu(restaurantId) {
    const { menuItems } = await apiRequest(`/menu/restaurant/${restaurantId}`)
    return menuItems.map(mapMenuItem)
  },
  async listOrders() {
    const { orders } = await apiRequest('/orders/mine')
    return orders.map(mapOrder)
  },
  mapOrder,
}

import { useEffect, useRef, useState } from 'react'
import DeliveryPartnerContext from './deliveryPartnerContext'
import { useCustomer } from '../hooks/useCustomer'
import { customerApi } from '../services/customerApi'
import { deliveryApi } from '../services/deliveryApi'
import { connectOrderSocket } from '../services/orderSocket'
import { demoAvailableDeliveries, demoCurrentDelivery, demoDeliveryEarnings, demoDeliveryProfile } from '../services/deliveryDemo'

const initialDashboard = {
  activeDelivery: { order: demoCurrentDelivery, assignment: { status: 'ACCEPTED' } },
  availableOrders: demoAvailableDeliveries,
  today: { deliveries: 8, earnings: 920, rating: 4.8 },
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function mapOrder(order, assignment) {
  const mapped = customerApi.mapOrder(order)
  const restaurant = order.restaurantId
  const address = order.address || {}
  return {
    ...mapped,
    restaurantName: typeof restaurant === 'object' ? restaurant?.name || 'Restaurant' : 'Restaurant',
    customer: mapped.customer || (typeof order.customerId === 'object' ? order.customerId?.name : '') || 'Customer',
    customerPhone: typeof order.customerId === 'object' ? order.customerId?.phone : '',
    orderNumber: order.orderNumber || mapped.orderNumber,
    itemsText: (order.items || []).map((item) => `${item.quantity} × ${item.name}`).join(' · '),
    addressText: [address.addressLine1, address.addressLine2, address.city, address.postalCode].filter(Boolean).join(', '),
    distance: `${Number(assignment?.distanceMeters ? assignment.distanceMeters / 1000 : order.distanceKm || 2.3).toFixed(1)} km`,
    deliveryStatus: assignment?.status || order.deliveryStatus,
    assignmentId: assignment?._id || order.deliveryAssignmentId,
    earning: assignment?.earning || order.estimatedEarning || order.earning || 0,
  }
}

function mapAssignment(assignment) {
  return mapOrder(assignment.orderId, assignment)
}

export function DeliveryPartnerProvider({ children }) {
  const { user } = useCustomer()
  const [profile, setProfile] = useState(() => readStorage('nosh-delivery-profile', demoDeliveryProfile))
  const [dashboard, setDashboard] = useState(() => readStorage('nosh-delivery-dashboard', initialDashboard))
  const [orders, setOrders] = useState(() => readStorage('nosh-delivery-orders', demoAvailableDeliveries))
  const [earnings, setEarnings] = useState(() => readStorage('nosh-delivery-earnings', demoDeliveryEarnings))
  const [apiNotice, setApiNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const noticeHandler = useRef(setApiNotice)
  const deliverySocket = useRef(null)

  useEffect(() => {
    noticeHandler.current = setApiNotice
  }, [setApiNotice])

  useEffect(() => localStorage.setItem('nosh-delivery-profile', JSON.stringify(profile)), [profile])
  useEffect(() => localStorage.setItem('nosh-delivery-dashboard', JSON.stringify(dashboard)), [dashboard])
  useEffect(() => localStorage.setItem('nosh-delivery-orders', JSON.stringify(orders)), [orders])
  useEffect(() => localStorage.setItem('nosh-delivery-earnings', JSON.stringify(earnings)), [earnings])

  useEffect(() => {
    if (user?.role !== 'DELIVERY_PARTNER' || !localStorage.getItem('nosh-token')) return undefined
    let active = true

    async function loadDeliveryData() {
      try {
        const profileResult = await deliveryApi.getProfile()
        if (!active) return
        if (!profileResult.partner) {
          setProfile({
            _id: null,
            userId: { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' },
            vehicleType: 'Motorcycle',
            vehicleNumber: '',
            licenseDocument: '',
            isVerified: false,
            verificationStatus: 'PENDING',
            isOnline: false,
            rating: 0,
            earnings: 0,
          })
          setDashboard({ activeDelivery: null, availableOrders: [], today: { deliveries: 0, earnings: 0, rating: 0 } })
          setOrders([])
          setEarnings({ today: { deliveries: 0, amount: 0 }, lifetime: 0, daily: [], recent: [] })
          setApiNotice('Create your delivery profile to get started.')
          return
        }
        setProfile(profileResult.partner)
        const [dashboardResult, ordersResult, earningsResult] = await Promise.all([
          deliveryApi.getDashboard(),
          deliveryApi.listOrders(),
          deliveryApi.getEarnings(),
        ])
        if (!active) return
        const activeAssignment = dashboardResult.activeDelivery
        const normalizedDashboard = {
          ...dashboardResult,
          activeDelivery: activeAssignment
            ? { ...activeAssignment, order: mapOrder(activeAssignment.order, activeAssignment.assignment) }
            : null,
          availableOrders: (dashboardResult.availableOrders || []).map((order) => mapOrder(order, {
            _id: order.deliveryAssignmentId,
            status: order.deliveryStatus,
            distanceMeters: order.distanceKm ? order.distanceKm * 1000 : undefined,
          })),
        }
        const assignedOrders = (ordersResult.assigned || []).map(mapAssignment)
        const availableOrders = (ordersResult.available || []).map((order) => mapOrder(order))
        setDashboard(normalizedDashboard)
        setOrders([...assignedOrders, ...availableOrders])
        setEarnings(earningsResult)
        setApiNotice(dashboardResult.partner?.isVerified ? 'Delivery account connected.' : 'Your documents are waiting for verification.')
      } catch (error) {
        if (active) setApiNotice(error.message)
      }
    }

    loadDeliveryData()
    return () => { active = false }
  }, [user?.email, user?.id, user?.name, user?.phone, user?.role])

  async function refresh() {
    if (!localStorage.getItem('nosh-token')) return
    setBusy(true)
    try {
      const [dashboardResult, ordersResult, earningsResult] = await Promise.all([
        deliveryApi.getDashboard(), deliveryApi.listOrders(), deliveryApi.getEarnings(),
      ])
      const activeAssignment = dashboardResult.activeDelivery
      setDashboard({
        ...dashboardResult,
        activeDelivery: activeAssignment
          ? { ...activeAssignment, order: mapOrder(activeAssignment.order, activeAssignment.assignment) }
          : null,
        availableOrders: (dashboardResult.availableOrders || []).map((order) => mapOrder(order, {
          _id: order.deliveryAssignmentId,
          status: order.deliveryStatus,
          distanceMeters: order.distanceKm ? order.distanceKm * 1000 : undefined,
        })),
      })
      setOrders([...(ordersResult.assigned || []).map(mapAssignment), ...(ordersResult.available || []).map((order) => mapOrder(order, {
        _id: order.deliveryAssignmentId,
        status: order.deliveryStatus,
        distanceMeters: order.distanceKm ? order.distanceKm * 1000 : undefined,
      }))])
      setEarnings(earningsResult)
    } catch (error) {
      setApiNotice(error.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'DELIVERY_PARTNER' || !localStorage.getItem('nosh-token')) return undefined
    const socket = connectOrderSocket()
    deliverySocket.current = socket
    socket?.on('delivery:request', (order) => {
      const normalized = mapOrder(order, { _id: order.deliveryAssignmentId, status: 'OFFERED', distanceMeters: (order.distanceKm || 0) * 1000 })
      setDashboard((current) => ({
        ...current,
        availableOrders: [normalized, ...(current.availableOrders || []).filter((item) => item.id !== normalized.id)],
      }))
      setOrders((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)])
    })
    socket?.on('delivery:request-expired', ({ orderId }) => {
      setDashboard((current) => ({ ...current, availableOrders: (current.availableOrders || []).filter((item) => item.id !== orderId) }))
      setOrders((current) => current.filter((item) => item.id !== orderId))
    })
    socket?.on('notification:new', (notification) => {
      setApiNotice(`${notification.title}: ${notification.message}`)
    })
    return () => {
      socket?.disconnect()
      if (deliverySocket.current === socket) deliverySocket.current = null
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (user?.role !== 'DELIVERY_PARTNER' || !localStorage.getItem('nosh-token') || !profile.isOnline) return undefined
    if (!navigator.geolocation) return undefined
    const socket = deliverySocket.current
    if (!socket) return undefined

    let lastSentAt = 0
    let lastCoordinates = null
    const watchId = navigator.geolocation.watchPosition((position) => {
      const coordinates = [position.coords.longitude, position.coords.latitude]
      const now = Date.now()
      const movedEnough = !lastCoordinates
        || Math.abs(coordinates[0] - lastCoordinates[0]) + Math.abs(coordinates[1] - lastCoordinates[1]) > 0.00015
      const elapsed = now - lastSentAt
      if (lastSentAt && (elapsed < 10000 || (!movedEnough && elapsed < 15000))) return
      lastCoordinates = coordinates
      lastSentAt = now
      socket.emit('delivery:location', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }, (result) => {
        if (!result?.ok) {
          noticeHandler.current(result?.message || 'Unable to update delivery location.')
          return
        }
        setProfile((current) => ({ ...current, currentLocation: { type: 'Point', coordinates } }))
      })
    }, () => {
      noticeHandler.current('Allow location access while online to receive nearby delivery requests.')
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 })

    return () => navigator.geolocation.clearWatch(watchId)
  }, [profile.isOnline, user?.id, user?.role])

  async function toggleOnline() {
    const next = !profile.isOnline
    if (localStorage.getItem('nosh-token')) {
      try {
        const result = await deliveryApi.setOnline(next)
        setProfile(result.partner)
        setDashboard((current) => ({ ...current, partner: result.partner }))
        setApiNotice(next ? 'You are online and can receive deliveries.' : 'You are offline.')
        await refresh()
      } catch (error) {
        setApiNotice(error.message)
      }
      return
    }
    if (next && !profile.isVerified) {
      setApiNotice('Your profile must be verified before going online.')
      return
    }
    setProfile((current) => ({ ...current, isOnline: next }))
    setDashboard((current) => ({ ...current, partner: { ...current.partner, isOnline: next } }))
  }

  async function saveProfile(updates) {
    if (localStorage.getItem('nosh-token')) {
      const result = await deliveryApi.updateProfile(updates)
      setProfile(result.partner)
      setApiNotice('Delivery profile saved. Verification is required before accepting orders.')
      return result.partner
    }
    const nextProfile = {
      ...profile,
      ...updates,
      isVerified: false,
      verificationStatus: 'PENDING',
      isOnline: false,
      isAvailable: false,
      rejectionReason: '',
    }
    setProfile(nextProfile)
    setApiNotice('Details submitted. Approval is required before you can go online.')
    return nextProfile
  }

  async function acceptDelivery(order) {
    if (order._id && localStorage.getItem('nosh-token')) {
      await deliveryApi.acceptOrder(order._id)
      setApiNotice(`Order #${order.orderNumber} accepted.`)
      await refresh()
      return
    }
    const accepted = { ...order, deliveryStatus: 'ACCEPTED' }
    setDashboard((current) => ({ ...current, activeDelivery: { order: accepted, assignment: { status: 'ACCEPTED' } }, availableOrders: current.availableOrders.filter((entry) => entry.id !== order.id) }))
    setOrders((current) => current.filter((entry) => entry.id !== order.id))
  }

  async function declineDelivery(order) {
    if (order._id && localStorage.getItem('nosh-token')) {
      const result = await deliveryApi.declineOrder(order._id)
      setApiNotice(result.nextPartnerOffered ? 'Request declined. Sending it to the next nearest partner.' : 'Request declined. No other nearby partner is online.')
      setDashboard((current) => ({ ...current, availableOrders: (current.availableOrders || []).filter((entry) => entry.id !== order.id) }))
      setOrders((current) => current.filter((entry) => entry.id !== order.id))
      return
    }
    setDashboard((current) => ({ ...current, availableOrders: (current.availableOrders || []).filter((entry) => entry.id !== order.id) }))
    setOrders((current) => current.filter((entry) => entry.id !== order.id))
  }

  async function markPickedUp(order) {
    if (order._id && localStorage.getItem('nosh-token')) {
      await deliveryApi.markPickedUp(order._id)
      await refresh()
      return
    }
    const updatedOrder = { ...order, status: 'OUT_FOR_DELIVERY', deliveryStatus: 'PICKED_UP' }
    setDashboard((current) => ({ ...current, activeDelivery: { ...current.activeDelivery, order: updatedOrder, assignment: { ...current.activeDelivery.assignment, status: 'PICKED_UP' } } }))
  }

  async function markDelivered(order) {
    if (order._id && localStorage.getItem('nosh-token')) {
      await deliveryApi.markDelivered(order._id)
      await refresh()
      return
    }
    setDashboard((current) => ({
      ...current,
      activeDelivery: null,
      today: { ...current.today, deliveries: current.today.deliveries + 1, earnings: current.today.earnings + (order.earning || 115) },
    }))
    setProfile((current) => ({ ...current, earnings: current.earnings + (order.earning || 115) }))
    setEarnings((current) => ({
      ...current,
      lifetime: current.lifetime + (order.earning || 115),
      today: { deliveries: current.today.deliveries + 1, amount: current.today.amount + (order.earning || 115) },
    }))
  }

  async function updateLocation() {
    if (!navigator.geolocation) throw new Error('Location is not supported by this browser.')
    const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }))
    const coordinates = [position.coords.longitude, position.coords.latitude]
    if (localStorage.getItem('nosh-token')) await deliveryApi.updateLocation(coordinates)
    setProfile((current) => ({ ...current, currentLocation: { type: 'Point', coordinates } }))
    setApiNotice('Your location was updated.')
  }

  return (
    <DeliveryPartnerContext.Provider value={{ profile, dashboard, orders, earnings, apiNotice, busy, refresh, toggleOnline, saveProfile, acceptDelivery, declineDelivery, markPickedUp, markDelivered, updateLocation, setApiNotice }}>
      {children}
    </DeliveryPartnerContext.Provider>
  )
}

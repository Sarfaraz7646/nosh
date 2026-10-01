import { useEffect, useState } from 'react'
import { restaurants } from '../services/catalog'
import { restaurantApi } from '../services/restaurantApi'
import RestaurantDashboardContext from './restaurantDashboardContext'

const starterRestaurant = restaurants[0]

function readLocal(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

const defaultProfile = {
  _id: null,
  name: starterRestaurant.name,
  description: starterRestaurant.description,
  cuisine: starterRestaurant.cuisine.join(', '),
  address: starterRestaurant.address,
  addressLine1: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560038',
  location: { type: 'Point', coordinates: [77.6408, 12.9784] },
  locationLongitude: '77.6408',
  locationLatitude: '12.9784',
  phone: '+91 98765 43210',
  image: starterRestaurant.image,
  isOpen: true,
}

const defaultMenu = starterRestaurant.menu.map((item) => ({ ...item, isAvailable: true }))

export function RestaurantDashboardProvider({ children }) {
  const [profile, setProfile] = useState(() => readLocal('nosh-dashboard-profile', defaultProfile))
  const [menuItems, setMenuItems] = useState(() => readLocal('nosh-dashboard-menu', defaultMenu))
  const [isOpen, setIsOpen] = useState(() => readLocal('nosh-dashboard-open', true))
  const [apiNotice, setApiNotice] = useState('')

  useEffect(() => localStorage.setItem('nosh-dashboard-profile', JSON.stringify(profile)), [profile])
  useEffect(() => localStorage.setItem('nosh-dashboard-menu', JSON.stringify(menuItems)), [menuItems])
  useEffect(() => localStorage.setItem('nosh-dashboard-open', JSON.stringify(isOpen)), [isOpen])

  useEffect(() => {
    if (!(localStorage.getItem('nosh-token') || localStorage.getItem('restaurant-token') || localStorage.getItem('token'))) return undefined
    let active = true

    async function loadRestaurantData() {
      try {
        const result = await restaurantApi.getMine()
        const restaurant = result.restaurants?.[0]
        if (!restaurant) {
          if (active) setApiNotice('No restaurant is linked to this account yet.')
          return
        }
        const address = restaurant.address
        const location = restaurant.location || address?.location
        const nextProfile = {
          ...restaurant,
          cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : '',
          address: address && typeof address === 'object'
            ? [address.addressLine1, address.addressLine2, address.city, address.state, address.postalCode].filter(Boolean).join(', ')
            : '',
          locationLongitude: location?.coordinates?.[0]?.toString() || '',
          locationLatitude: location?.coordinates?.[1]?.toString() || '',
        }
        const menuResult = await restaurantApi.getMenu(restaurant._id)
        if (!active) return
        setProfile((current) => ({ ...current, ...nextProfile }))
        setMenuItems((menuResult.menuItems || []).map((item) => ({ ...item, id: item._id })))
        setApiNotice('Connected to MongoDB.')
      } catch (error) {
        if (active) setApiNotice(error.message)
      }
    }

    loadRestaurantData()
    return () => { active = false }
  }, [])

  function updateProfile(updates) {
    setProfile((current) => ({ ...current, ...updates }))
  }

  function saveMenuItem(item) {
    setMenuItems((current) => item.id
      ? current.map((entry) => entry.id === item.id ? { ...entry, ...item } : entry)
      : [{ ...item, id: `local-${Date.now()}` }, ...current])
  }

  function removeMenuItem(id) {
    setMenuItems((current) => current.filter((item) => item.id !== id))
  }

  async function syncProfile(updates) {
    const hasToken = localStorage.getItem('nosh-token') || localStorage.getItem('restaurant-token') || localStorage.getItem('token')
    if (!hasToken) {
      setApiNotice('Saved in this browser. Connect a restaurant account to sync with MongoDB.')
      return
    }
    try {
      const apiUpdates = {
        ...updates,
        ...(typeof updates.cuisine === 'string' ? { cuisine: updates.cuisine.split(',').map((item) => item.trim()).filter(Boolean) } : {}),
      }
      const longitude = Number(updates.locationLongitude)
      const latitude = Number(updates.locationLatitude)
      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        apiUpdates.location = { type: 'Point', coordinates: [longitude, latitude] }
      } else {
        delete apiUpdates.location
      }
      delete apiUpdates.locationLongitude
      delete apiUpdates.locationLatitude
      delete apiUpdates.address
      delete apiUpdates.phone
      if (!profile._id) {
        const { restaurant } = await restaurantApi.create({
          ...apiUpdates,
          address: {
            addressLine1: updates.addressLine1,
            city: updates.city,
            state: updates.state,
            postalCode: updates.postalCode,
            country: 'India',
          },
        })
        setProfile((current) => ({
          ...current,
          ...restaurant,
          cuisine: updates.cuisine,
          address: [updates.addressLine1, updates.city, updates.state, updates.postalCode].filter(Boolean).join(', '),
        }))
        setApiNotice('Restaurant created. It will appear to customers after approval.')
        return
      }
      const { restaurant } = await restaurantApi.update(profile._id, apiUpdates)
      setProfile((current) => ({ ...current, ...restaurant }))
      setApiNotice('Restaurant profile synced.')
    } catch (error) {
      setApiNotice(error.message)
    }
  }

  async function syncMenuItem(item) {
    if (!profile._id || !(localStorage.getItem('nosh-token') || localStorage.getItem('restaurant-token') || localStorage.getItem('token'))) {
      setApiNotice('Saved in this browser. Connect a restaurant account to sync with MongoDB.')
      return
    }
    try {
      const result = item._id
        ? await restaurantApi.updateMenuItem(item._id, item)
        : await restaurantApi.createMenuItem({ ...item, restaurantId: profile._id })
      setApiNotice(item._id ? 'Menu item synced.' : 'Menu item created in MongoDB.')
      return result.menuItem
    } catch (error) {
      setApiNotice(error.message)
    }
  }

  return (
    <RestaurantDashboardContext.Provider value={{ profile, menuItems, isOpen, apiNotice, setApiNotice, updateProfile, saveMenuItem, removeMenuItem, setIsOpen, syncProfile, syncMenuItem }}>
      {children}
    </RestaurantDashboardContext.Provider>
  )
}

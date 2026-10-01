import { useContext } from 'react'
import RestaurantDashboardContext from '../store/restaurantDashboardContext'

export function useRestaurantDashboard() {
  const context = useContext(RestaurantDashboardContext)
  if (!context) throw new Error('useRestaurantDashboard must be used inside RestaurantDashboardProvider')
  return context
}

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const token = localStorage.getItem('nosh-token') || localStorage.getItem('restaurant-token') || localStorage.getItem('token')
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers })
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.message || `Request failed (${response.status})`)
  }
  if (response.status === 204) return null
  return response.json()
}

export const restaurantApi = {
  getMine: () => request('/restaurants/mine'),
  create: (restaurant) => request('/restaurants', { method: 'POST', body: JSON.stringify(restaurant) }),
  update: (id, updates) => request(`/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  archive: (id) => request(`/restaurants/${id}`, { method: 'DELETE' }),
  getMenu: (restaurantId) => request(`/menu/restaurant/${restaurantId}?includeUnavailable=true`),
  createMenuItem: (item) => request('/menu', { method: 'POST', body: JSON.stringify(item) }),
  updateMenuItem: (id, updates) => request(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: 'DELETE' }),
}

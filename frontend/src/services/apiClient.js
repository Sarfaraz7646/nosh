export const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
export const API_ORIGIN = API_ROOT.replace(/\/api$/, '')

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('nosh-token') || localStorage.getItem('restaurant-token') || localStorage.getItem('token')
  const { auth = true, ...fetchOptions } = options
  const headers = { ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}), ...fetchOptions.headers }
  if (token && auth) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_ROOT}${path}`, { ...fetchOptions, headers })
  } catch (cause) {
    const error = new Error('The backend is unavailable. Check that the API server is running.')
    error.cause = cause
    throw error
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    const error = new Error(result.message || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

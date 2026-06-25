import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function getValidToken(): Promise<string | null> {
  const { token, expires_at, refresh_token } = useAuthStore.getState()

  if (!token || !expires_at) return null

  const fiveMinutes = 5 * 60 * 1000
  if (Date.now() <= expires_at - fiveMinutes) {
    return token
  }

  // Token expires soon — serialize parallel refreshes to a single request
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  if (!refresh_token) {
    window.dispatchEvent(new CustomEvent('session-expired'))
    return null
  }

  isRefreshing = true
  refreshPromise = apiClient
    .post('/api/v1/panel/auth/token/refresh', { refresh_token })
    .then(({ data }) => {
      useAuthStore.getState().setSession(data)
      return data.access_token as string
    })
    .catch(() => {
      useAuthStore.getState().clearSession()
      window.dispatchEvent(new CustomEvent('session-expired'))
      return null
    })
    .finally(() => {
      isRefreshing = false
      refreshPromise = null
    })

  return refreshPromise
}

apiClient.interceptors.request.use(async (config) => {
  // Skip auth injection for auth endpoints to avoid loops
  if (config.url?.includes('/auth/token')) return config

  const token = await getValidToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Refresh endpoint failures are already handled in getValidToken
      const isRefreshEndpoint = error.config?.url?.includes('/auth/token/refresh')
      if (!isRefreshEndpoint) {
        useAuthStore.getState().clearSession()
        window.dispatchEvent(new CustomEvent('session-expired'))
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

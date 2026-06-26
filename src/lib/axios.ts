import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import type { ToastType } from '../store/toastStore'

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

  if (!token) return null
  if (!expires_at) return token

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

// Decouple toast notifications from the React store — ToastStack listens for this event
function dispatchToast(message: string, type: ToastType): void {
  window.dispatchEvent(new CustomEvent('api-toast', { detail: { message, type } }))
}

apiClient.interceptors.request.use(async (config) => {
  // Skip auth injection for auth endpoints to avoid loops
  if (config.url?.includes('/auth/token')) return config

  const token = await getValidToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // For FormData (multipart/form-data), remove Content-Type so the browser
  // sets it automatically with the correct multipart boundary.
  // Without this, axios 1.x detects application/json and serializes FormData to JSON,
  // causing 422 on the backend.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  return config
})

// Error codes handled inline by components — not intercepted globally
const LOCAL_ERROR_CODES = new Set([
  'EMPTY_MESSAGE',
  'MESSAGE_TOO_LONG',
  'INVALID_TIME_RANGE',
  'INVALID_DAYS',
  'INVALID_CURRENT_PASSWORD',
  'FILE_TOO_LARGE',
  'FILE_TYPE_NOT_ALLOWED',
  'EMAIL_ALREADY_EXISTS',
])

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (offline, timeout, CORS) — no response object
    if (!error.response) {
      dispatchToast('Sin conexión. Verifica tu conexión a internet.', 'error')
      return Promise.reject(error)
    }

    const status: number = error.response.status
    const code: string | undefined = error.response.data?.detail?.code
    const message: string | undefined = error.response.data?.detail?.message

    // 401 — session expired
    if (status === 401) {
      const isRefreshEndpoint = error.config?.url?.includes('/auth/token/refresh')
      if (!isRefreshEndpoint) {
        useAuthStore.getState().clearSession()
        window.dispatchEvent(new CustomEvent('session-expired'))
      }
      return Promise.reject(error)
    }

    // Pass local errors through untouched so components handle them inline
    if (code && LOCAL_ERROR_CODES.has(code)) {
      return Promise.reject(error)
    }

    switch (status) {
      case 403:
        if (code === 'ADVISOR_INACTIVE') {
          // Show blocking modal — token stays until user confirms (see SessionExpiredModal)
          useAuthStore.getState().setSessionExpired(true)
          useAuthStore.getState().setBlockedModal(
            'Tu cuenta ha sido desactivada',
            'Contacta a un administrador para restablecer el acceso.'
          )
        } else if (code === 'FORBIDDEN') {
          dispatchToast('No tienes permiso para realizar esta acción.', 'error')
        } else if (code === 'CONVERSATION_OUTSIDE_AREA') {
          dispatchToast('Esta conversación no pertenece a tu área.', 'warning')
        } else if (code === 'BOT_IS_ACTIVE') {
          dispatchToast('El bot tiene el control de esta conversación.', 'warning')
        } else if (code === 'NOT_ASSIGNED') {
          dispatchToast('No estás asignado a esta conversación.', 'warning')
        } else if (code === 'BOT_ALREADY_ACTIVE') {
          dispatchToast('El bot ya controla esta conversación.', 'info')
        } else if (code === 'CANNOT_EDIT_YOURSELF') {
          dispatchToast('No puedes editar tu propio perfil desde esta sección.', 'warning')
        } else {
          dispatchToast(message || 'Acceso denegado.', 'error')
        }
        break

      case 409:
        if (code === 'ALREADY_ASSIGNED') {
          dispatchToast('Otro asesor tomó esta conversación primero.', 'warning')
        } else if (code === 'MAX_CONVERSATIONS_REACHED') {
          dispatchToast(message || 'Límite de conversaciones alcanzado.', 'warning')
        } else if (code === 'ALREADY_CLOSED') {
          dispatchToast('Esta conversación ya fue cerrada.', 'info')
        } else if (code === 'ALREADY_REVIEWED') {
          dispatchToast('Esta alerta ya fue revisada.', 'info')
        } else if (code === 'CONVERSATION_NOT_ESCALATED') {
          dispatchToast('La conversación no está en estado escalado.', 'warning')
        } else {
          dispatchToast(message || 'Conflicto al procesar la solicitud.', 'warning')
        }
        break

      case 500:
        dispatchToast('Error interno del servidor. Intenta nuevamente.', 'error')
        break

      case 502:
        if (code === 'META_API_ERROR') {
          dispatchToast('No se pudo enviar el mensaje a WhatsApp. Intenta nuevamente.', 'error')
        } else if (code === 'STORAGE_ERROR') {
          dispatchToast('Error al guardar el archivo. Intenta nuevamente.', 'error')
        } else {
          dispatchToast('Error de comunicación con un servicio externo.', 'error')
        }
        break

      case 503:
        dispatchToast('Servicio de almacenamiento no disponible.', 'error')
        break

      default:
        dispatchToast(`Error inesperado (${status}). Intenta nuevamente.`, 'error')
        break
    }

    return Promise.reject(error)
  }
)

export default apiClient

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

// Exported so useWebSocket can get a valid token before reconnecting (L-03).
export async function getValidToken(): Promise<string | null> {
  const { token, expires_at, refresh_token } = useAuthStore.getState()

  // C-02: No RT means there's no session at all — bail immediately.
  if (!refresh_token) return null

  // AT is in memory and still fresh — return it directly.
  if (token && expires_at) {
    const fiveMinutes = 5 * 60 * 1000
    if (Date.now() <= expires_at - fiveMinutes) {
      return token
    }
  }

  // AT is absent (page reload) or expiring — refresh.
  // Serialize parallel calls to a single refresh request.
  if (isRefreshing && refreshPromise) {
    return refreshPromise
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

// Error codes handled inline by components — not intercepted globally.
// Add a code here when the component shows a context-specific toast or inline UI
// (form error, modal error) for that code. The interceptor will pass it through untouched.
const LOCAL_ERROR_CODES = new Set([
  // Form / inline validation
  'EMPTY_MESSAGE',
  'MESSAGE_TOO_LONG',
  'INVALID_TIME_RANGE',
  'INVALID_DAYS',
  'INVALID_CURRENT_PASSWORD',
  'FILE_TOO_LARGE',
  'FILE_TYPE_NOT_ALLOWED',
  'EMAIL_ALREADY_EXISTS',
  'INVALID_SPECIALTY_FOR_AREA',
  // Context-specific: each page shows a message tailored to its action
  'ALREADY_ASSIGNED',
  'MAX_CONVERSATIONS_REACHED',
  'BOT_ALREADY_ACTIVE',
  'ALREADY_CLOSED',
  'CONVERSATION_NOT_ESCALATED',
  'ADVISOR_NOT_FOUND',
])

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/token') &&
      !error.config?.url?.includes('/auth/token/refresh')

    // Network error (offline, timeout, CORS) — no response object.
    // Skip the global toast for the login endpoint: signIn() handles the UX inline
    // (the error could be CORS or backend-down, not the user's internet connection).
    if (!error.response) {
      if (!isLoginEndpoint) {
        dispatchToast('Sin conexión. Verifica tu conexión a internet.', 'error')
      }
      return Promise.reject(error)
    }

    const status: number = error.response.status
    const code: string | undefined = error.response.data?.detail?.code

    // 401 — session expired.
    // Exclude the login endpoint: a 401 there means wrong credentials, not an expired session.
    if (status === 401) {
      const isRefreshEndpoint = error.config?.url?.includes('/auth/token/refresh')
      if (!isRefreshEndpoint && !isLoginEndpoint) {
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
        } else if (code === 'CANNOT_EDIT_YOURSELF') {
          dispatchToast('No puedes editar tu propio perfil desde esta sección.', 'warning')
        } else {
          // M-04: never pass raw backend message — use generic string instead.
          dispatchToast('Acceso denegado.', 'error')
        }
        break

      case 409:
        if (code === 'ALREADY_REVIEWED') {
          dispatchToast('Esta alerta ya fue revisada.', 'info')
        } else {
          // M-04: use hardcoded string, not raw backend message.
          dispatchToast('Conflicto al procesar la solicitud.', 'warning')
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

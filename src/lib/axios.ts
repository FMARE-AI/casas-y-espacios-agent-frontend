import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore, getStoredSession } from '../store/authStore'
import type { ToastType } from '../store/toastStore'

// Retry/refresh bookkeeping flags stashed on the request config as it's replayed
// through the interceptor chain.
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  _networkRetry?: boolean
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null
// Session epoch the in-flight refresh belongs to, plus a monotonic id so a
// superseded refresh cannot clear the bookkeeping of the one that replaced it.
let refreshEpoch = -1
let refreshSeq = 0

// H-02: Queue for requests that received 401 while token refresh was in progress
interface FailedRequest {
  epoch: number
  resolve: (token: string) => void
  reject: (error: unknown) => void
}
let failedQueue: FailedRequest[] = []

// Only settles the entries belonging to `epoch`. Requests queued by a session
// that has since ended must not be resolved with a different session's token
// (nor the reverse), so entries from other epochs stay queued for their own
// refresh instead of being drained here.
function processQueue(epoch: number, error: unknown | null, token: string | null = null) {
  const mine = failedQueue.filter((p) => p.epoch === epoch)
  failedQueue = failedQueue.filter((p) => p.epoch !== epoch)
  mine.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
}

// Single writer of isRefreshing/refreshPromise/failedQueue, regardless of whether
// the refresh was triggered proactively (getValidToken) or reactively (401 handler
// below) — this is what lets processQueue() always run, closing the race where a
// request queued by the 401 handler could be left pending forever if the in-flight
// refresh it was waiting on had actually been started by getValidToken().
function refreshSession(refresh_token: string): Promise<string | null> {
  // Captured before the request goes out. If the session ends while this is in
  // flight (logout, expiry, ADVISOR_INACTIVE), the epoch moves and this refresh
  // becomes an orphan: it must neither install its tokens nor tear anything
  // down, because whatever session exists when it lands is not the one it was
  // issued for. Without this guard a slow refresh belonging to a session the
  // user already left would clearSession() the session they logged into
  // afterwards — reproduced in dev, where a fresh login survived 29s before a
  // stale refresh's 401 destroyed it.
  const epoch = useAuthStore.getState().sessionEpoch
  const seq = ++refreshSeq
  const isCurrent = () => useAuthStore.getState().sessionEpoch === epoch

  isRefreshing = true
  refreshEpoch = epoch
  const promise = apiClient
    .post('/api/v1/panel/auth/token/refresh', { refresh_token })
    .then(({ data }) => {
      if (!isCurrent()) {
        // Orphan success: dropped deliberately. Installing these tokens would
        // silently resurrect a session the user ended, or overwrite the
        // credentials of the one they just created.
        processQueue(epoch, new Error('Refresh belonged to an ended session'), null)
        return null
      }
      useAuthStore.getState().setSession(data)
      const newToken = data.access_token as string
      processQueue(epoch, null, newToken)
      return newToken
    })
    .catch((error) => {
      if (!isCurrent()) {
        processQueue(epoch, error, null)
        return null
      }

      const status = axios.isAxiosError(error) ? error.response?.status : undefined

      // Only an explicit auth rejection means the SESSION is invalid.
      if (status === 401 || status === 403) {
        // ...unless another tab rotated the refresh token between our read of it
        // and this response. The rejection then says nothing about the session —
        // it says our copy of the token was stale. Adopt the rotated one and let
        // callers retry, instead of logging every open tab out.
        const rotated = getStoredSession()?.refresh_token
        if (rotated && rotated !== refresh_token) {
          useAuthStore.setState({ refresh_token: rotated })
          processQueue(epoch, error, null)
          return null
        }

        useAuthStore.getState().endSession()
        processQueue(epoch, error, null)
        return null
      }

      // Everything else means the refresh could not be COMPLETED, not that the
      // session is invalid: a network failure (offline, timeout, backend
      // restarting) or a server-side fault (500, or the documented 503 when the
      // backend cannot reach Supabase Auth). Logging the user out here turns a
      // backend hiccup into a forced re-login while their refresh token is still
      // perfectly good. Callers retry instead: HTTP requests fail visibly with
      // their own toast, and the WS backoff chain keeps polling until the
      // backend answers again.
      processQueue(epoch, error, null)
      return null
    })
    .finally(() => {
      // Only release the slot if a newer refresh has not already claimed it.
      if (refreshSeq === seq) {
        isRefreshing = false
        refreshPromise = null
        refreshEpoch = -1
      }
    })

  refreshPromise = promise
  return promise
}

// True when a refresh is in flight AND it belongs to the session asking about
// it. A refresh left over from an ended session is not something the current
// session may await — it would hand back the previous session's token.
function hasCurrentRefreshInFlight(): boolean {
  return (
    isRefreshing &&
    refreshPromise !== null &&
    refreshEpoch === useAuthStore.getState().sessionEpoch
  )
}

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
  if (hasCurrentRefreshInFlight()) {
    return refreshPromise
  }

  return refreshSession(refresh_token)
}

// Refreshes unconditionally, skipping the "token still looks fresh" shortcut in
// getValidToken(). Needed when the SERVER has rejected a token the client still
// believes is valid (WebSocket close 4001) — clock skew between browser and
// backend, or a token revoked ahead of its stated expiry. Returns null when
// there is no session left to refresh.
export async function forceRefreshToken(): Promise<string | null> {
  const { refresh_token } = useAuthStore.getState()
  if (!refresh_token) return null
  if (hasCurrentRefreshInFlight()) return refreshPromise
  return refreshSession(refresh_token)
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
  async (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/token') &&
      !error.config?.url?.includes('/auth/token/refresh')

    // Network error (offline, timeout, CORS) — no response object.
    // Skip the global toast for the login endpoint: signIn() handles the UX inline
    // (the error could be CORS or backend-down, not the user's internet connection).
    if (!error.response) {
      const originalRequest = error.config as RetryableRequestConfig

      // The most common trigger for this branch is the FIRST request after a
      // long-idle tab/laptop sleep: the OS network stack or the backend's
      // connection needs a moment to wake up, so the very first GET times out
      // even though a retry a moment later succeeds instantly. Retry once,
      // silently, before bothering the user with a toast — this is what used
      // to make GestionPage "tardar mucho y no encontrar nada" after inactivity.
      if (
        originalRequest &&
        originalRequest.method?.toLowerCase() === 'get' &&
        !originalRequest._networkRetry &&
        !isLoginEndpoint
      ) {
        originalRequest._networkRetry = true
        await new Promise((r) => setTimeout(r, 800))
        try {
          return await apiClient(originalRequest)
        } catch (retryError) {
          if (axios.isAxiosError(retryError) && !retryError.response) {
            dispatchToast('Sin conexión. Verifica tu conexión a internet.', 'error')
          }
          return Promise.reject(retryError)
        }
      }

      if (!isLoginEndpoint) {
        dispatchToast('Sin conexión. Verifica tu conexión a internet.', 'error')
      }
      return Promise.reject(error)
    }

    const status: number = error.response.status
    const code: string | undefined = error.response.data?.detail?.code

    // H-02: Handle 401 with automatic retry after token refresh
    // Exclude the login endpoint: a 401 there means wrong credentials, not an expired session.
    if (status === 401) {
      const isRefreshEndpoint = error.config?.url?.includes('/auth/token/refresh')
      const originalRequest = error.config as RetryableRequestConfig

      if (!isRefreshEndpoint && !isLoginEndpoint && !originalRequest._retry) {
        originalRequest._retry = true

        const refresh_token = useAuthStore.getState().refresh_token

        // C-02: no RT means there's no session left to refresh — bail immediately
        // instead of posting a null refresh_token (the backend requires a string
        // and would just reject it with a 422).
        if (!refresh_token) {
          useAuthStore.getState().endSession()
          return Promise.reject(error)
        }

        // If a refresh is already in flight — proactive (getValidToken) or
        // reactive (this same branch, from another request) — queue this one.
        // refreshSession() is the single writer of isRefreshing/refreshPromise and
        // always calls processQueue() when it settles, so this is resolved/rejected
        // regardless of which caller actually triggered the in-flight refresh.
        if (hasCurrentRefreshInFlight()) {
          const epoch = useAuthStore.getState().sessionEpoch
          return new Promise((resolve, reject) => {
            failedQueue.push({
              epoch,
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                resolve(apiClient(originalRequest))
              },
              reject: (err) => reject(err),
            })
          })
        }

        const newToken = await refreshSession(refresh_token)
        if (!newToken) {
          return Promise.reject(error)
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }

      // For refresh endpoint failures or login endpoint, just reject
      if (!isRefreshEndpoint && !isLoginEndpoint) {
        useAuthStore.getState().endSession()
      }
      return Promise.reject(error)
    }

    // Pass local errors through untouched so components handle them inline
    if (code && LOCAL_ERROR_CODES.has(code)) {
      return Promise.reject(error)
    }

    switch (status) {
      case 422:
        // Validation errors are handled locally by components/forms (e.g. password length constraints)
        return Promise.reject(error)

      case 403:
        if (code === 'ADVISOR_INACTIVE') {
          // The account is gone as far as the panel is concerned: end the
          // session immediately rather than leaving a usable token behind a
          // modal, and let the login screen carry the explanation.
          useAuthStore.getState().endSession({
            title: 'Tu cuenta ha sido desactivada',
            message: 'Contacta a un administrador para restablecer el acceso.',
          })
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

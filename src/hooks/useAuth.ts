import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, getStoredSession } from '../store/authStore'
import { advisorsService } from '../services/advisors'
import { ROUTES } from '../constants/routes'
import apiClient from '../lib/axios'

type AxiosLike = { response?: { status?: number; data?: { detail?: { code?: string; message?: string } } } }

function getBackendErrorCode(error: unknown): string | undefined {
  return (error as AxiosLike)?.response?.data?.detail?.code
}

function isAdvisorInactiveError(error: unknown): boolean {
  return getBackendErrorCode(error) === 'ADVISOR_INACTIVE'
}

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const stored = getStoredSession()

    if (stored) {
      // Keep refresh_token and expires_at in sync from storage, but never write
      // token: null here — doing so would reset a valid in-memory AT on every
      // re-run of this effect (React Router's navigate() ref can change after
      // navigation, triggering the [navigate] dep and re-running this effect
      // right after a successful login, which would cause a redirect loop).
      const currentToken = useAuthStore.getState().token
      useAuthStore.setState({
        refresh_token: stored.refresh_token,
        expires_at: stored.expires_at,
      })

      if (currentToken) {
        // AT already in memory — session is valid (e.g. effect re-ran after login
        // due to navigate() ref change). Nothing to load; just ensure loading is off.
        useAuthStore.getState().setLoading(false)
        const handleExpiredEarly = () => useAuthStore.getState().setSessionExpired(true)
        window.addEventListener('session-expired', handleExpiredEarly)
        return () => window.removeEventListener('session-expired', handleExpiredEarly)
      }

      // No AT in memory — obtain one via the axios interceptor (which will call
      // /auth/token/refresh using the RT before forwarding the getMe() request).
      advisorsService.getMe()
        .then(({ advisor }) => {
          useAuthStore.getState().setAdvisor(advisor)
          if (advisor.must_change_password) {
            useAuthStore.getState().setFirstLogin(true)
            navigate(ROUTES.FIRST_LOGIN)
          }
        })
        .catch(() => {
          useAuthStore.getState().clearSession()
        })
        .finally(() => {
          useAuthStore.getState().setLoading(false)
        })
    } else {
      useAuthStore.getState().setLoading(false)
    }

    const handleExpired = () => useAuthStore.getState().setSessionExpired(true)
    window.addEventListener('session-expired', handleExpired)

    return () => {
      window.removeEventListener('session-expired', handleExpired)
    }
  }, [navigate])

  async function signIn(email: string, password: string, rememberMe = true): Promise<boolean> {
    useAuthStore.getState().setLoading(true)
    useAuthStore.getState().setError(null)

    try {
      const { data } = await apiClient.post('/api/v1/panel/auth/token', { email, password })

      useAuthStore.getState().setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        rememberMe,
      })

      const { advisor } = await advisorsService.getMe()
      useAuthStore.getState().setAdvisor(advisor)

      if (advisor.must_change_password) {
        useAuthStore.getState().setFirstLogin(true)
        navigate('/first-login')
      } else {
        navigate('/')
      }
      return true
    } catch (err) {
      const backendCode = getBackendErrorCode(err)
      // M-04: log the backend code for debugging but never expose raw backend messages to the UI.
      console.error('[useAuth] signIn failed, code:', backendCode)

      useAuthStore.getState().clearSession()

      const hasResponse = !!(err as AxiosLike)?.response
      if (!hasResponse) {
        // Network error (CORS, backend unreachable, timeout) — no HTTP response available.
        useAuthStore.getState().setError(
          'No se pudo conectar al servidor. Verifica tu conexión o intenta más tarde.'
        )
      } else if (isAdvisorInactiveError(err)) {
        useAuthStore.getState().setError(
          'Tu cuenta está desactivada. Contacta a un administrador.'
        )
      } else {
        // M-04: generic message — avoids leaking internal backend error details.
        useAuthStore.getState().setError('Correo o contraseña incorrectos.')
      }
      return false
    } finally {
      useAuthStore.getState().setLoading(false)
    }
  }

  async function signOut() {
    useAuthStore.getState().clearSession()
    navigate('/login')
  }

  return {
    token: store.token,
    advisor: store.advisor,
    role: store.role,
    isLoading: store.isLoading,
    isFirstLogin: store.isFirstLogin,
    sessionExpired: store.sessionExpired,
    error: store.error,
    signIn,
    signOut,
  }
}

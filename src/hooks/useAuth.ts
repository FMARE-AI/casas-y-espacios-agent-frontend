import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, getStoredSession } from '../store/authStore'
import { advisorsService } from '../services/advisors'
import apiClient from '../lib/axios'

type AxiosLike = { response?: { status?: number; data?: { detail?: { code?: string; message?: string } } } }

function getBackendErrorCode(error: unknown): string | undefined {
  return (error as AxiosLike)?.response?.data?.detail?.code
}

function getBackendErrorMessage(error: unknown): string | undefined {
  return (error as AxiosLike)?.response?.data?.detail?.message
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
      // Restore session state without re-saving to localStorage
      useAuthStore.setState({
        token: stored.access_token,
        refresh_token: stored.refresh_token,
        expires_at: stored.expires_at,
      })
      advisorsService.getMe()
        .then(({ advisor }) => {
          useAuthStore.getState().setAdvisor(advisor)
          if (advisor.must_change_password) {
            useAuthStore.getState().setFirstLogin(true)
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
  }, [])

  async function signIn(email: string, password: string) {
    useAuthStore.getState().setLoading(true)
    useAuthStore.getState().setError(null)

    try {
      const { data } = await apiClient.post('/api/v1/panel/auth/token', { email, password })

      useAuthStore.getState().setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
      })

      const { advisor } = await advisorsService.getMe()
      useAuthStore.getState().setAdvisor(advisor)

      if (data.must_change_password) {
        useAuthStore.getState().setFirstLogin(true)
        navigate('/first-login')
      } else {
        navigate('/')
      }
    } catch (err) {
      const backendCode = getBackendErrorCode(err)
      const backendMsg = getBackendErrorMessage(err)
      console.error('[useAuth] signIn failed', { backendCode, backendMsg, err })

      useAuthStore.getState().clearSession()

      if (isAdvisorInactiveError(err)) {
        useAuthStore.getState().setError(
          'Tu cuenta está desactivada. Contacta a un administrador.'
        )
      } else {
        const message = backendMsg ?? (err instanceof Error ? err.message : 'Error al iniciar sesión')
        useAuthStore.getState().setError(message)
      }
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

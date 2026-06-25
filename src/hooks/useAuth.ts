import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, getStoredToken } from '../store/authStore'
import { advisorsService } from '../services/advisors'
import { ROUTES } from '../constants/routes'
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
    const stored = getStoredToken()

    if (stored) {
      useAuthStore.getState().setToken(stored)
      advisorsService.getMe()
        .then(({ advisor }) => {
          useAuthStore.getState().setAdvisor(advisor)
          if (advisor.must_change_password) {
            useAuthStore.getState().setFirstLogin(true)
            navigate(ROUTES.FIRST_LOGIN)
          }
        })
        .catch(() => {
          useAuthStore.getState().reset()
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
      const token: string = data.access_token

      useAuthStore.getState().setToken(token)

      const { advisor } = await advisorsService.getMe()
      useAuthStore.getState().setAdvisor(advisor)

      if (advisor.must_change_password) {
        useAuthStore.getState().setFirstLogin(true)
        navigate('/first-login')
      } else {
        navigate('/')
      }
    } catch (err) {
      const backendCode = getBackendErrorCode(err)
      const backendMsg = getBackendErrorMessage(err)
      console.error('[useAuth] signIn failed', { backendCode, backendMsg, err })

      useAuthStore.getState().reset()

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
    useAuthStore.getState().reset()
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

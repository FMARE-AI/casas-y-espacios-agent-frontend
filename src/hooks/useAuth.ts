import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, getStoredSession } from '../store/authStore'
import { advisorsService } from '../services/advisors'
import { ROUTES } from '../constants/routes'
import apiClient from '../lib/axios'
import { supabase } from '../lib/supabase'

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
      // C-02: stored.access_token is always null (AT is never persisted).
      // The axios interceptor will refresh it automatically before the first request.
      useAuthStore.setState({
        token: null,
        refresh_token: stored.refresh_token,
        expires_at: stored.expires_at,
      })

      // Only sync Supabase if we have a valid AT (available after first interceptor refresh).
      // Without an AT here, Supabase will be synced in setSession after the refresh call.
      // L-02: log only err.message, never the error object that might include tokens.
      if (stored.access_token) {
        supabase.auth.setSession({
          access_token: stored.access_token,
          refresh_token: stored.refresh_token || '',
        }).catch((err) => console.error('Supabase session sync failed:', err?.message ?? 'unknown'))
      }

      // getMe() will trigger the axios interceptor which refreshes the AT before the request.
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

      if (isAdvisorInactiveError(err)) {
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

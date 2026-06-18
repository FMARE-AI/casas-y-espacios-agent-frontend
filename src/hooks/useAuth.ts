// Hook principal de autenticación.
// Sincroniza Supabase Auth con el authStore.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { advisorsService } from '../services'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  // TODO: llamar getMe() cuando el backend esté disponible
  // async function loadAdvisor() { ... }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      store.setSession(session)
      store.setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        store.setSession(session)

        if (event === 'SIGNED_IN') {
          store.setLoading(false)
        }

        if (event === 'SIGNED_OUT') {
          store.reset()
          store.setLoading(false)
        }

        if (event === 'TOKEN_REFRESHED') {
          store.setSession(session)
        }
      }
    )

    const handleExpired = () => store.setSessionExpired(true)
    window.addEventListener('session-expired', handleExpired)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('session-expired', handleExpired)
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    store.reset()
    navigate('/login')
  }

  return {
    session: store.session,
    advisor: store.advisor,
    role: store.role,
    isLoading: store.isLoading,
    isFirstLogin: store.isFirstLogin,
    sessionExpired: store.sessionExpired,
    signIn,
    signOut,
  }
}

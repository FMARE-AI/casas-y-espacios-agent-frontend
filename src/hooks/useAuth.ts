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

  async function loadAdvisor() {
    try {
      const { advisor } = await advisorsService.getMe()
      store.setAdvisor(advisor)
      // Si full_name está vacío, el asesor aún no configuró su cuenta
      const isFirst = !advisor.full_name || advisor.full_name.trim() === ''
      store.setFirstLogin(isFirst)
    } catch {
      await supabase.auth.signOut()
    } finally {
      store.setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      store.setSession(session)
      if (session) {
        loadAdvisor()
      } else {
        store.setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        store.setSession(session)

        if (event === 'SIGNED_IN' && session) {
          await loadAdvisor()
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

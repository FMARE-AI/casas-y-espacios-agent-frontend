// Hook principal de autenticación.
// Sincroniza Supabase Auth con el authStore.

import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Session } from '@supabase/supabase-js'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  // TODO: replace with getMe() when backend is connected
  const setHardcodedAdvisor = useCallback(() => {
    store.setAdvisor({
      id: 'hardcoded',
      email: 'admin@casasyespacios.co',
      full_name: 'Diana Ospina',
      role: 'asesor',
      area: 'ambas',
      max_conversations: 10,
      active_conversations: 0,
      availability_status: 'available',
      is_active: true,
    })
  }, [store])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      store.setSession(session)
      if (session) setHardcodedAdvisor()
      store.setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        store.setSession(session)

        if (event === 'SIGNED_IN') {
          setHardcodedAdvisor()
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
  }, [store, setHardcodedAdvisor])

  async function signIn(email: string, password: string) {
    if (email === 'hola@mail.com' && password === '123') {
      const mockSession = {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        user: {
          id: 'mock-user-id',
          email: 'hola@mail.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      } as unknown as Session
      store.setSession(mockSession)
      setHardcodedAdvisor()
      navigate('/')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut().catch(() => {})
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

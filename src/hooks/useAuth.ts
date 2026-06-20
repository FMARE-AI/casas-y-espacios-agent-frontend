// Hook principal de autenticación.
// Sincroniza Supabase Auth con el authStore.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Session } from '@supabase/supabase-js'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // TODO: replace with getMe() when backend is connected
    function setHardcodedAdvisor() {
      useAuthStore.getState().setAdvisor({
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
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      useAuthStore.getState().setSession(session)
      if (session) setHardcodedAdvisor()
      useAuthStore.getState().setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        useAuthStore.getState().setSession(session)

        if (event === 'SIGNED_IN') {
          setHardcodedAdvisor()
          useAuthStore.getState().setLoading(false)
        }

        if (event === 'SIGNED_OUT') {
          useAuthStore.getState().reset()
          useAuthStore.getState().setLoading(false)
        }

        if (event === 'TOKEN_REFRESHED') {
          useAuthStore.getState().setSession(session)
        }
      }
    )

    const handleExpired = () => useAuthStore.getState().setSessionExpired(true)
    window.addEventListener('session-expired', handleExpired)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('session-expired', handleExpired)
    }
  }, [])

  async function signIn(email: string, password: string) {
    const mockCredentials: Record<string, { token: string; advisor: import('../types').Advisor }> = {
      'asesor@mock.com': {
        token: 'mock-token-asesor',
        advisor: {
          id: 'mock-asesor',
          email: 'asesor@mock.com',
          full_name: 'Diana Ospina',
          role: 'asesor',
          area: 'ambas',
          max_conversations: 3,
          active_conversations: 1,
          availability_status: 'available',
          is_active: true,
        },
      },
      'admin@mock.com': {
        token: 'mock-token-admin',
        advisor: {
          id: 'mock-admin',
          email: 'admin@mock.com',
          full_name: 'Jorge Ramírez',
          role: 'admin',
          area: 'ambas',
          max_conversations: 10,
          active_conversations: 0,
          availability_status: 'available',
          is_active: true,
        },
      },
    }

    const mock = password === '123' ? mockCredentials[email] : undefined
    if (mock) {
      const mockSession = {
        access_token: mock.token,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: `${mock.token}-refresh`,
        user: {
          id: mock.advisor.id,
          email: mock.advisor.email,
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      } as unknown as Session
      useAuthStore.getState().setSession(mockSession)
      useAuthStore.getState().setAdvisor(mock.advisor)
      navigate('/')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut().catch(() => {})
    useAuthStore.getState().reset()
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

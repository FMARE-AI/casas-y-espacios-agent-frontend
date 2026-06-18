// Estado global de autenticación con Zustand.
// La sesión se sincroniza con Supabase Auth.

import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Advisor, AdvisorRole } from '../types'

interface AuthState {
  session: Session | null
  advisor: Advisor | null
  role: AdvisorRole | null
  isLoading: boolean
  isFirstLogin: boolean
  sessionExpired: boolean

  setSession: (session: Session | null) => void
  setAdvisor: (advisor: Advisor | null) => void
  setLoading: (loading: boolean) => void
  setFirstLogin: (value: boolean) => void
  setSessionExpired: (value: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  advisor: null,
  role: null,
  isLoading: true,
  isFirstLogin: false,
  sessionExpired: false,

  setSession: (session) => set({ session }),

  setAdvisor: (advisor) => set({
    advisor,
    role: advisor?.role ?? null,
  }),

  setLoading: (isLoading) => set({ isLoading }),
  setFirstLogin: (isFirstLogin) => set({ isFirstLogin }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),

  reset: () => set({
    session: null,
    advisor: null,
    role: null,
    isFirstLogin: false,
    sessionExpired: false,
  }),
}))

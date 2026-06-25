import { create } from 'zustand'
import type { Advisor, AdvisorRole } from '../types'
import { supabase } from '../lib/supabase'

const TOKEN_KEY = 'panel_token'
const REFRESH_TOKEN_KEY = 'panel_refresh_token'
const EXPIRES_AT_KEY = 'panel_expires_at'

export interface SessionData {
  access_token: string
  refresh_token: string
  expires_in: number // seconds
}

interface AuthState {
  token: string | null
  refresh_token: string | null
  expires_at: number | null // timestamp in ms
  advisor: Advisor | null
  role: AdvisorRole | null
  isLoading: boolean
  isFirstLogin: boolean
  sessionExpired: boolean
  error: string | null

  setSession: (data: SessionData) => void
  clearSession: () => void
  setToken: (token: string | null) => void
  setAdvisor: (advisor: Advisor | null) => void
  setLoading: (loading: boolean) => void
  setFirstLogin: (value: boolean) => void
  setSessionExpired: (value: boolean) => void
  setError: (message: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refresh_token: null,
  expires_at: null,
  advisor: null,
  role: null,
  isLoading: true,
  isFirstLogin: false,
  sessionExpired: false,
  error: null,

  setSession: (data) => {
    const expires_at = Date.now() + data.expires_in * 1000
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
    localStorage.setItem(EXPIRES_AT_KEY, String(expires_at))

    // Synchronize token session with Supabase client to authorize Storage uploads
    supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    }).catch((err) => console.error('Supabase setSession failed:', err))

    set({ token: data.access_token, refresh_token: data.refresh_token, expires_at })
  },

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    supabase.auth.signOut().catch(() => {})
    set({
      token: null,
      refresh_token: null,
      expires_at: null,
      advisor: null,
      role: null,
      isFirstLogin: false,
      sessionExpired: false,
      error: null,
    })
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    set({ token })
  },

  setAdvisor: (advisor) =>
    set((state) => {
      if (!advisor) {
        return { advisor: null, role: null }
      }
      if (!state.advisor) {
        return { advisor, role: advisor.role ?? null }
      }
      const mergedAdvisor = {
        ...state.advisor,
        ...advisor,
        role: advisor.role || state.advisor.role || 'asesor',
      } as Advisor
      return { advisor: mergedAdvisor, role: mergedAdvisor.role }
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setFirstLogin: (isFirstLogin) => set({ isFirstLogin }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  setError: (error) => set({ error }),

  reset: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    supabase.auth.signOut().catch(() => {})
    set({
      token: null,
      refresh_token: null,
      expires_at: null,
      advisor: null,
      role: null,
      isFirstLogin: false,
      sessionExpired: false,
      error: null,
    })
  },
}))

export const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY)

export interface StoredSession {
  access_token: string
  refresh_token: string
  expires_at: number // absolute timestamp in ms
}

export const getStoredSession = (): StoredSession | null => {
  const access_token = localStorage.getItem(TOKEN_KEY)
  const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY)
  const expires_at_str = localStorage.getItem(EXPIRES_AT_KEY)

  if (!access_token) return null

  return {
    access_token,
    refresh_token: refresh_token || '',
    expires_at: expires_at_str ? Number(expires_at_str) : Date.now() + 3600 * 1000,
  }
}

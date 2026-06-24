import { create } from 'zustand'
import type { Advisor, AdvisorRole } from '../types'

const TOKEN_KEY = 'panel_token'

interface AuthState {
  token: string | null
  advisor: Advisor | null
  role: AdvisorRole | null
  isLoading: boolean
  isFirstLogin: boolean
  sessionExpired: boolean
  error: string | null

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
  advisor: null,
  role: null,
  isLoading: true,
  isFirstLogin: false,
  sessionExpired: false,
  error: null,

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
    set({
      token: null,
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

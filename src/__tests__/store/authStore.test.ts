import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../../store/authStore'
import type { Advisor, AdvisorRole } from '../../types'

// ── Factories ──────────────────────────────────────────────

function mockAdvisor(overrides?: Partial<Advisor>): Advisor {
  return {
    id: 'test-id',
    email: 'test@casasyespacios.co',
    full_name: 'Test User',
    role: 'asesor',
    area: 'administrativa',
    max_conversations: 3,
    active_conversations: 0,
    availability_status: 'available',
    avatar_url: null,
    is_active: true,
    must_change_password: false,
    ...overrides,
  }
}

// ── Helpers ────────────────────────────────────────────────

function resetStore(): void {
  useAuthStore.setState({
    token: null,
    advisor: null,
    role: null,
    isLoading: true,
    isFirstLogin: false,
    sessionExpired: false,
    error: null,
  })
  localStorage.clear()
}

// ── Tests ──────────────────────────────────────────────────

describe('authStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // ── Initial state ──

  describe('initial state', () => {
    it('has null token, advisor, role, and error', () => {
      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.advisor).toBeNull()
      expect(state.role).toBeNull()
      expect(state.error).toBeNull()
    })

    it('has isLoading true by default', () => {
      expect(useAuthStore.getState().isLoading).toBe(true)
    })

    it('has isFirstLogin false by default', () => {
      expect(useAuthStore.getState().isFirstLogin).toBe(false)
    })

    it('has sessionExpired false by default', () => {
      expect(useAuthStore.getState().sessionExpired).toBe(false)
    })
  })

  // ── setToken ──

  describe('setToken', () => {
    it('stores the token string', () => {
      useAuthStore.getState().setToken('my-jwt-token')
      expect(useAuthStore.getState().token).toBe('my-jwt-token')
    })

    it('does NOT persist token to localStorage (memory-only)', () => {
      useAuthStore.getState().setToken('my-jwt-token')
      expect(localStorage.getItem('panel_token')).toBeNull()
    })

    it('clears token in store when set to null', () => {
      useAuthStore.getState().setToken('my-jwt-token')
      useAuthStore.getState().setToken(null)
      expect(useAuthStore.getState().token).toBeNull()
    })
  })

  // ── setAdvisor ──

  describe('setAdvisor', () => {
    it('stores the advisor object', () => {
      const advisor = mockAdvisor()
      useAuthStore.getState().setAdvisor(advisor)
      expect(useAuthStore.getState().advisor).toBe(advisor)
    })

    it('derives role from advisor.role (asesor)', () => {
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'asesor' }))
      expect(useAuthStore.getState().role).toBe('asesor')
    })

    it('derives role from advisor.role (admin)', () => {
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'admin' }))
      expect(useAuthStore.getState().role).toBe('admin')
    })

    it('sets role to null when advisor is null', () => {
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'admin' }))
      useAuthStore.getState().setAdvisor(null)
      expect(useAuthStore.getState().role).toBeNull()
      expect(useAuthStore.getState().advisor).toBeNull()
    })

    it('updates role when advisor role changes', () => {
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'asesor' }))
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'admin' }))
      expect(useAuthStore.getState().role).toBe('admin')
    })

    it('preserves existing role when updated with an advisor object that has no role', () => {
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'admin' }))
      const partialAdvisor = { ...mockAdvisor(), role: undefined } as unknown as Advisor
      useAuthStore.getState().setAdvisor(partialAdvisor)
      expect(useAuthStore.getState().role).toBe('admin')
    })
  })

  // ── Simple setters ──

  describe('setLoading', () => {
    it('sets isLoading to the given value', () => {
      useAuthStore.getState().setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
      useAuthStore.getState().setLoading(true)
      expect(useAuthStore.getState().isLoading).toBe(true)
    })
  })

  describe('setFirstLogin', () => {
    it('sets isFirstLogin to the given value', () => {
      useAuthStore.getState().setFirstLogin(true)
      expect(useAuthStore.getState().isFirstLogin).toBe(true)
      useAuthStore.getState().setFirstLogin(false)
      expect(useAuthStore.getState().isFirstLogin).toBe(false)
    })
  })

  // The epoch is what lets async work started under one session (above all an
  // in-flight token refresh) tell whether the session it belongs to is still
  // the current one before it applies its result.
  describe('sessionEpoch', () => {
    it('advances when the session is cleared', () => {
      const before = useAuthStore.getState().sessionEpoch
      useAuthStore.getState().clearSession()
      expect(useAuthStore.getState().sessionEpoch).toBe(before + 1)
    })

    it('advances on reset()', () => {
      const before = useAuthStore.getState().sessionEpoch
      useAuthStore.getState().reset()
      expect(useAuthStore.getState().sessionEpoch).toBe(before + 1)
    })

    it('does NOT advance on setSession — a refresh continues the same session', () => {
      const before = useAuthStore.getState().sessionEpoch
      useAuthStore.getState().setSession({
        access_token: 'at',
        refresh_token: 'rt',
        expires_in: 3600,
      })
      expect(useAuthStore.getState().sessionEpoch).toBe(before)
    })
  })

  describe('setSessionExpired', () => {
    it('sets sessionExpired to the given value', () => {
      useAuthStore.getState().setSessionExpired(true)
      expect(useAuthStore.getState().sessionExpired).toBe(true)
      useAuthStore.getState().setSessionExpired(false)
      expect(useAuthStore.getState().sessionExpired).toBe(false)
    })
  })

  describe('setError', () => {
    it('sets error message', () => {
      useAuthStore.getState().setError('Something went wrong')
      expect(useAuthStore.getState().error).toBe('Something went wrong')
    })

    it('clears error when set to null', () => {
      useAuthStore.getState().setError('Error')
      useAuthStore.getState().setError(null)
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  // ── reset ──

  describe('reset', () => {
    it('clears token, advisor, role, isFirstLogin, sessionExpired, error, and localStorage', () => {
      useAuthStore.getState().setToken('my-jwt-token')
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'admin' }))
      useAuthStore.getState().setFirstLogin(true)
      useAuthStore.getState().setSessionExpired(true)
      useAuthStore.getState().setError('Some error')

      useAuthStore.getState().reset()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.advisor).toBeNull()
      expect(state.role).toBeNull()
      expect(state.isFirstLogin).toBe(false)
      expect(state.sessionExpired).toBe(false)
      expect(state.error).toBeNull()
      expect(localStorage.getItem('panel_token')).toBeNull()
    })

    it('does NOT reset isLoading — leaves it at its current value', () => {
      useAuthStore.getState().setLoading(false)
      useAuthStore.getState().reset()
      expect(useAuthStore.getState().isLoading).toBe(false)

      useAuthStore.getState().setLoading(true)
      useAuthStore.getState().reset()
      expect(useAuthStore.getState().isLoading).toBe(true)
    })
  })

  // ── Role derivation edge cases ──

  describe('role derivation — edge cases', () => {
    it('admin advisor results in role === "admin"', () => {
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'admin' }))
      const { role } = useAuthStore.getState()
      expect(role).toBe('admin')
      expect(role).not.toBe('asesor')
    })

    it('role type satisfies AdvisorRole union', () => {
      useAuthStore.getState().setAdvisor(mockAdvisor({ role: 'asesor' }))
      const role = useAuthStore.getState().role as AdvisorRole
      const validRoles: AdvisorRole[] = ['asesor', 'admin']
      expect(validRoles).toContain(role)
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, getRememberPreference, isSameBrowserSession } from '../../store/authStore'
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

  // Keeps a second tab from using a refresh token that another tab already
  // rotated away — using it would 401 and log every tab out.
  describe('cross-tab refresh token sync', () => {
    it('adopts a refresh token rotated by another tab', () => {
      useAuthStore.setState({ refresh_token: 'old-rt' })

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'panel_refresh_token',
        newValue: 'rotated-rt',
      }))

      expect(useAuthStore.getState().refresh_token).toBe('rotated-rt')
    })

    it('ignores a removal — it may be a logout racing a fresh login', () => {
      useAuthStore.setState({ refresh_token: 'current-rt' })

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'panel_refresh_token',
        newValue: null,
      }))

      expect(useAuthStore.getState().refresh_token).toBe('current-rt')
    })

    it('ignores storage events for unrelated keys', () => {
      useAuthStore.setState({ refresh_token: 'current-rt' })

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'panel_last_activity',
        newValue: '123456',
      }))

      expect(useAuthStore.getState().refresh_token).toBe('current-rt')
    })
  })

  // endSession is the single path for a session ending on its own. What matters
  // is that it FORCES the login screen — ProtectedRoute redirects the moment
  // `token` is null — and carries the reason there, in one step, with no modal
  // left to finish the job.
  // "Recordar sesión" describes the DEVICE, not the session. Wiping it on logout
  // made the checkbox forget the user's choice every single time they signed out.
  describe('remember preference', () => {
    it('survives clearSession so the checkbox comes back the way it was left', () => {
      useAuthStore.getState().setSession({
        access_token: 'at',
        refresh_token: 'rt',
        expires_in: 3600,
        rememberMe: true,
      })
      expect(getRememberPreference()).toBe(true)

      useAuthStore.getState().clearSession()

      expect(getRememberPreference()).toBe(true)
      // ...while the credentials themselves are gone.
      expect(localStorage.getItem('panel_refresh_token')).toBeNull()
    })

    it('records an unchecked box too', () => {
      useAuthStore.getState().setSession({
        access_token: 'at',
        refresh_token: 'rt',
        expires_in: 3600,
        rememberMe: false,
      })

      expect(getRememberPreference()).toBe(false)
      // Not remembering means the token must not outlive the tab.
      expect(localStorage.getItem('panel_refresh_token')).toBeNull()
      expect(sessionStorage.getItem('panel_refresh_token')).toBe('rt')
    })

    // The panel has always defaulted to remembering. Reading an absent key as
    // false silently downgraded every first-time visitor to a session that dies
    // with the browser.
    it('defaults to true when nothing was ever chosen', () => {
      expect(getRememberPreference()).toBe(true)
    })

    it('stays off once explicitly turned off', () => {
      localStorage.setItem('panel_remember', 'false')

      expect(getRememberPreference()).toBe(false)
    })
  })

  // Two tabs share one localStorage, so a sign-in in one is visible to the
  // other. Following a rotation is right when both tabs are the same sign-in and
  // wrong when they are not: the second tab may be a different advisor, and
  // adopting its token would leave this tab rendering one user while
  // authenticating as another.
  describe('cross-tab session identity', () => {
    function signIn(refresh_token: string) {
      useAuthStore.getState().setSession({
        access_token: 'at',
        refresh_token,
        expires_in: 3600,
        rememberMe: true,
      })
    }

    it('treats a token refresh as the same sign-in', () => {
      signIn('rt-1')
      // A refresh omits rememberMe — that is how it is told apart from a login.
      useAuthStore.getState().setSession({
        access_token: 'at-2',
        refresh_token: 'rt-2',
        expires_in: 3600,
      })

      expect(isSameBrowserSession()).toBe(true)
    })

    it('adopts a rotation from the same sign-in', () => {
      signIn('rt-1')
      useAuthStore.setState({ refresh_token: 'rt-1' })

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'panel_refresh_token',
        newValue: 'rt-rotated',
      }))

      expect(useAuthStore.getState().refresh_token).toBe('rt-rotated')
    })

    it('ignores a token written by a DIFFERENT sign-in', () => {
      signIn('rt-mine')
      useAuthStore.setState({ refresh_token: 'rt-mine' })

      // Another tab signs in — possibly as another advisor — which stamps a new
      // session id into the shared storage.
      localStorage.setItem('panel_session_id', 'some-other-sign-in')

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'panel_refresh_token',
        newValue: 'rt-of-another-account',
      }))

      expect(useAuthStore.getState().refresh_token).toBe('rt-mine')
    })
  })

  describe('endSession', () => {
    it('clears the credentials so the app falls back to the login screen', () => {
      useAuthStore.setState({ token: 'at', refresh_token: 'rt', expires_at: Date.now() + 1000 })

      useAuthStore.getState().endSession()

      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().refresh_token).toBeNull()
      expect(localStorage.getItem('panel_refresh_token')).toBeNull()
    })

    it('defaults to the expired notice', () => {
      useAuthStore.getState().endSession()

      expect(useAuthStore.getState().sessionNotice).toEqual({
        title: 'Tu sesión ha expirado',
        message: 'Por seguridad, tu sesión se cerró automáticamente. Ingresa nuevamente para continuar.',
      })
    })

    it('keeps a caller-supplied notice (inactivity, deactivated account)', () => {
      const notice = { title: 'Sesión cerrada por inactividad', message: 'Ingresa nuevamente.' }

      useAuthStore.getState().endSession(notice)

      expect(useAuthStore.getState().sessionNotice).toEqual(notice)
    })

    it('advances the session epoch, so an in-flight refresh is orphaned', () => {
      const before = useAuthStore.getState().sessionEpoch

      useAuthStore.getState().endSession()

      expect(useAuthStore.getState().sessionEpoch).toBe(before + 1)
    })

    // Regression guard. endSession leaves sessionExpired true; if a later login
    // did not clear it, the WebSocket guards (`!accessToken || sessionExpired`)
    // would refuse to connect and the panel would come up mute after a perfectly
    // good sign-in.
    it('does not leave the NEXT session marked as expired', () => {
      useAuthStore.getState().endSession()
      expect(useAuthStore.getState().sessionExpired).toBe(true)

      useAuthStore.getState().setSession({
        access_token: 'fresh-at',
        refresh_token: 'fresh-rt',
        expires_in: 3600,
      })

      expect(useAuthStore.getState().sessionExpired).toBe(false)
      expect(useAuthStore.getState().sessionNotice).toBeNull()
    })

    // A deliberate logout has nothing to explain — the login page must stay clean.
    it('a plain clearSession() leaves no notice behind', () => {
      useAuthStore.getState().endSession()
      expect(useAuthStore.getState().sessionNotice).not.toBeNull()

      useAuthStore.getState().clearSession()

      expect(useAuthStore.getState().sessionNotice).toBeNull()
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

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { useAuthStore } from '../../store/authStore'
import type { Advisor } from '../../types'

// vi.hoisted ensures refs are available inside the hoisted vi.mock factories
const { mockNavigate, mockApiPost, mockGetMe } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockApiPost: vi.fn(),
  mockGetMe: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../lib/axios', () => ({
  default: {
    post: mockApiPost,
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../../services/advisors', () => ({
  advisorsService: { getMe: mockGetMe },
}))

import { useAuth } from '../../hooks/useAuth'

// ── Factories ─────────────────────────────────────────────────────────────────

function makeAdvisor(overrides: Partial<Advisor> = {}): Advisor {
  return {
    id: 'advisor-1',
    email: 'ana@casasyespacios.co',
    full_name: 'Ana Gómez',
    role: 'asesor',
    area: 'administrativa',
    max_conversations: 3,
    active_conversations: 0,
    availability_status: 'available',
    is_active: true,
    avatar_url: null,
    must_change_password: false,
    ...overrides,
  }
}

function renderUseAuth() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    ),
  })
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useAuthStore.setState({
    token: null,
    advisor: null,
    role: null,
    isLoading: false,
    isFirstLogin: false,
    sessionExpired: false,
    error: null,
  })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAuth', () => {

  // ── signIn ────────────────────────────────────────────────────────────────

  describe('signIn — success flow', () => {
    it('calls POST /auth/token, stores token, fetches advisor, navigates to /', async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: 'real-jwt-token', refresh_token: 'real-refresh-token', expires_in: 3600 } })
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor() })

      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.signIn('ana@casasyespacios.co', 'password123')
      })

      expect(mockApiPost).toHaveBeenCalledWith('/api/v1/panel/auth/token', {
        email: 'ana@casasyespacios.co',
        password: 'password123',
      })
      expect(useAuthStore.getState().token).toBe('real-jwt-token')
      expect(localStorage.getItem('panel_refresh_token')).toBe('real-refresh-token')
      expect(useAuthStore.getState().advisor?.id).toBe('advisor-1')
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })

    it('navigates to original route in location state after successful login', async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: 'real-jwt-token', refresh_token: 'real-refresh-token', expires_in: 3600 } })
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor() })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/chat/a2b959aa-6c90-42bc-98fe-89033389d6bc' } }]}>
            {children}
          </MemoryRouter>
        ),
      })

      await act(async () => {
        await result.current.signIn('ana@casasyespacios.co', 'password123')
      })

      expect(mockNavigate).toHaveBeenCalledWith('/chat/a2b959aa-6c90-42bc-98fe-89033389d6bc', { replace: true })
    })
  })

  describe('signIn — must_change_password', () => {
    it('sets isFirstLogin and navigates to /first-login', async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: 'real-jwt-token', refresh_token: 'real-refresh-token', expires_in: 3600 } })
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor({ must_change_password: true }) })

      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.signIn('ana@casasyespacios.co', 'password123')
      })

      expect(useAuthStore.getState().isFirstLogin).toBe(true)
      expect(mockNavigate).toHaveBeenCalledWith('/first-login')
    })
  })

  describe('signIn — ADVISOR_INACTIVE 403', () => {
    it('resets store and sets descriptive error message', async () => {
      mockApiPost.mockRejectedValue({
        response: { status: 403, data: { detail: { code: 'ADVISOR_INACTIVE', message: 'Inactive' } } },
      })

      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.signIn('ana@casasyespacios.co', 'password123')
      })

      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().advisor).toBeNull()
      expect(useAuthStore.getState().error).toBe(
        'Tu cuenta está desactivada. Contacta a un administrador.'
      )
    })
  })

  describe('signIn — wrong credentials', () => {
    it('sets error from backend detail message', async () => {
      mockApiPost.mockRejectedValue({
        response: { status: 401, data: { detail: { code: 'INVALID_TOKEN', message: 'Credenciales incorrectas' } } },
      })

      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.signIn('ana@casasyespacios.co', 'wrongpassword')
      })

      expect(useAuthStore.getState().error).toBe('Correo o contraseña incorrectos.')
      expect(useAuthStore.getState().token).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalledWith('/')
      expect(mockNavigate).not.toHaveBeenCalledWith('/first-login')
    })
  })

  describe('signIn — getMe fails after successful token', () => {
    it('resets store and stores error message', async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: 'real-jwt-token', refresh_token: 'real-refresh-token', expires_in: 3600 } })
      mockGetMe.mockRejectedValue(new Error('Network Error'))

      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.signIn('ana@casasyespacios.co', 'password123')
      })

      expect(useAuthStore.getState().error).toBe('No se pudo conectar al servidor. Verifica tu conexión o intenta más tarde.')
      expect(useAuthStore.getState().token).toBeNull()
    })
  })

  describe('signIn — isLoading lifecycle', () => {
    it('sets isLoading false at end (finally)', async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: 'real-jwt-token' } })
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor() })

      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.signIn('ana@casasyespacios.co', 'password123')
      })

      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('sets isLoading false even when signIn fails', async () => {
      mockApiPost.mockRejectedValue(new Error('fail'))

      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.signIn('x@x.co', 'bad')
      })

      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  // ── Session restore on mount ───────────────────────────────────────────────

  describe('session restore on mount', () => {
    it('restores token and advisor from localStorage', async () => {
      localStorage.setItem('panel_refresh_token', 'stored-refresh-jwt')
      localStorage.setItem('panel_expires_at', String(Date.now() + 3600 * 1000))
      mockGetMe.mockImplementation(async () => {
        useAuthStore.setState({ token: 'stored-jwt' })
        return { advisor: makeAdvisor() }
      })

      const { unmount } = renderUseAuth()

      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().token).toBe('stored-jwt')
      expect(useAuthStore.getState().advisor?.id).toBe('advisor-1')
      unmount()
    })

    it('sets isFirstLogin when restored advisor has must_change_password', async () => {
      localStorage.setItem('panel_refresh_token', 'stored-refresh-jwt')
      localStorage.setItem('panel_expires_at', String(Date.now() + 3600 * 1000))
      mockGetMe.mockImplementation(async () => {
        useAuthStore.setState({ token: 'stored-jwt' })
        return { advisor: makeAdvisor({ must_change_password: true }) }
      })

      const { unmount } = renderUseAuth()

      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().isFirstLogin).toBe(true)
      unmount()
    })

    it('resets store when getMe fails during restore (expired token)', async () => {
      localStorage.setItem('panel_refresh_token', 'expired-refresh-jwt')
      localStorage.setItem('panel_expires_at', '0')
      mockGetMe.mockRejectedValue(new Error('401'))

      const { unmount } = renderUseAuth()

      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().token).toBeNull()
      expect(localStorage.getItem('panel_refresh_token')).toBeNull()
      unmount()
    })

    it('sets isLoading false when no token in localStorage', async () => {
      const { unmount } = renderUseAuth()

      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().isLoading).toBe(false)
      unmount()
    })
  })

  // Regression: this effect re-runs on every navigation and used to copy the
  // stored refresh token into the store unconditionally. Another tab signing in
  // as a different advisor would therefore be adopted on the victim tab's next
  // click — found by testing two real tabs, not by unit tests.
  describe('credentials written by a different sign-in', () => {
    it('does not adopt a refresh token stamped with another session id', async () => {
      localStorage.setItem('panel_refresh_token', 'rt-of-another-account')
      localStorage.setItem('panel_expires_at', String(Date.now() + 3600 * 1000))
      localStorage.setItem('panel_session_id', 'a-different-sign-in')
      useAuthStore.setState({ token: 'my-at', refresh_token: 'rt-mine' })

      const { unmount } = renderUseAuth()
      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().refresh_token).toBe('rt-mine')
      unmount()
    })

    it('still restores the session on a normal page load', async () => {
      // No session id stored at all: nothing claims a different sign-in, which
      // is what a plain reload of an older session looks like.
      localStorage.setItem('panel_refresh_token', 'rt-restored')
      localStorage.setItem('panel_expires_at', String(Date.now() + 3600 * 1000))
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor() })
      useAuthStore.setState({ token: 'my-at', refresh_token: null })

      const { unmount } = renderUseAuth()
      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().refresh_token).toBe('rt-restored')
      unmount()
    })
  })

  // ── session-expired event ──────────────────────────────────────────────────

  describe('session-expired event', () => {
    it('sets sessionExpired to true when event is dispatched', async () => {
      const { unmount } = renderUseAuth()

      await act(async () => {
        window.dispatchEvent(new CustomEvent('session-expired'))
      })

      expect(useAuthStore.getState().sessionExpired).toBe(true)
      unmount()
    })

    it('removes listener on unmount — event no longer triggers', async () => {
      const { unmount } = renderUseAuth()
      unmount()

      await act(async () => {
        window.dispatchEvent(new CustomEvent('session-expired'))
      })

      expect(useAuthStore.getState().sessionExpired).toBe(false)
    })
  })

  // ── signOut ───────────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('resets store, clears localStorage, and navigates to /login', async () => {
      useAuthStore.getState().setToken('active-token')
      useAuthStore.getState().setAdvisor(makeAdvisor())
      localStorage.setItem('panel_refresh_token', 'some-refresh-token')

      const { result } = renderUseAuth()

      await act(async () => { await result.current.signOut() })

      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().advisor).toBeNull()
      expect(localStorage.getItem('panel_refresh_token')).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})

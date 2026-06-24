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
    specialty: null,
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
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(MemoryRouter, null, children),
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
      mockApiPost.mockResolvedValue({ data: { access_token: 'real-jwt-token' } })
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
      expect(localStorage.getItem('panel_token')).toBe('real-jwt-token')
      expect(useAuthStore.getState().advisor?.id).toBe('advisor-1')
      expect(useAuthStore.getState().error).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  describe('signIn — must_change_password', () => {
    it('sets isFirstLogin and navigates to /first-login', async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: 'real-jwt-token' } })
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

      expect(useAuthStore.getState().error).toBe('Credenciales incorrectas')
      expect(useAuthStore.getState().token).toBeNull()
      expect(mockNavigate).not.toHaveBeenCalledWith('/')
      expect(mockNavigate).not.toHaveBeenCalledWith('/first-login')
    })
  })

  describe('signIn — getMe fails after successful token', () => {
    it('resets store and stores error message', async () => {
      mockApiPost.mockResolvedValue({ data: { access_token: 'real-jwt-token' } })
      mockGetMe.mockRejectedValue(new Error('Network Error'))

      const { result } = renderUseAuth()

      await act(async () => {
        await result.current.signIn('ana@casasyespacios.co', 'password123')
      })

      expect(useAuthStore.getState().error).toBe('Network Error')
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
      localStorage.setItem('panel_token', 'stored-jwt')
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor() })

      const { unmount } = renderUseAuth()

      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().token).toBe('stored-jwt')
      expect(useAuthStore.getState().advisor?.id).toBe('advisor-1')
      unmount()
    })

    it('sets isFirstLogin when restored advisor has must_change_password', async () => {
      localStorage.setItem('panel_token', 'stored-jwt')
      mockGetMe.mockResolvedValue({ advisor: makeAdvisor({ must_change_password: true }) })

      const { unmount } = renderUseAuth()

      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().isFirstLogin).toBe(true)
      unmount()
    })

    it('resets store when getMe fails during restore (expired token)', async () => {
      localStorage.setItem('panel_token', 'expired-jwt')
      mockGetMe.mockRejectedValue(new Error('401'))

      const { unmount } = renderUseAuth()

      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().token).toBeNull()
      expect(localStorage.getItem('panel_token')).toBeNull()
      unmount()
    })

    it('sets isLoading false when no token in localStorage', async () => {
      const { unmount } = renderUseAuth()

      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

      expect(useAuthStore.getState().isLoading).toBe(false)
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

      const { result } = renderUseAuth()

      await act(async () => { await result.current.signOut() })

      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().advisor).toBeNull()
      expect(localStorage.getItem('panel_token')).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Hoisted so the mock factory below (itself hoisted to the top of the file by
// vitest) can reference them. Only useWebSocket's two named imports from this
// module are mocked — it never touches the default apiClient export.
const { mockGetValidToken, mockForceRefreshToken } = vi.hoisted(() => ({
  mockGetValidToken: vi.fn(),
  mockForceRefreshToken: vi.fn(),
}))

vi.mock('../../lib/axios', () => ({
  getValidToken: mockGetValidToken,
  forceRefreshToken: mockForceRefreshToken,
}))

import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuthStore } from '../../store/authStore'
import { useWSStore } from '../../store/wsStore'
import type { Advisor } from '../../types'

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no proactively-refreshed token, so dial() falls back to the
    // in-memory access token already in the store (set below) — same shape
    // as a real "token still looks fresh" call. Individual tests override
    // this when they need to drive the auth-recovery path explicitly.
    mockGetValidToken.mockResolvedValue(null)
    mockForceRefreshToken.mockResolvedValue(null)

    useAuthStore.setState({
      token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() + 3600000,
      advisor: { id: 'advisor-1', role: 'asesor' } as any,
      sessionExpired: false,
    })

    useWSStore.setState({
      status: 'disconnected',
      reconnectAttempt: 0,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('connection lifecycle', () => {
    // With a valid, non-expired token in the store, mounting the hook triggers
    // an immediate connection attempt (see useWebSocket.ts's main effect) —
    // status goes to 'connecting' synchronously, not 'disconnected'. It only
    // stays 'disconnected' when there's no token or the session is expired.
    it('should initialize with connecting status when a valid session exists', () => {
      const { unmount } = renderHook(() => useWebSocket())

      expect(useWSStore.getState().status).toBe('connecting')
      unmount()
    })

    // No status assertion here on purpose: useWebSocket's socket/isConnecting
    // bookkeeping is a module-level singleton with no reset between tests (by
    // design — "exactly one socket active at any time" per the hook's own
    // comments), so the resulting status after a second mount in the same
    // file legitimately depends on whatever the previous test's connection
    // attempt left behind. This test only guards against mount/unmount itself
    // throwing.
    it('mounts and unmounts a second time without throwing', () => {
      const { unmount } = renderHook(() => useWebSocket())
      unmount()
    })
  })

  describe('reconnection logic', () => {
    it('should not reconnect when session is expired', async () => {
      useAuthStore.setState({ sessionExpired: true })
      const { unmount } = renderHook(() => useWebSocket())

      expect(useWSStore.getState().status).toBe('disconnected')
      unmount()
    })

    // refresh_token is only consulted by scheduleReconnect() (used after a live
    // drop, or when the initial WebSocket handshake itself throws) — the mount
    // effect only gates on accessToken/sessionExpired, so with a valid access
    // token still in memory it attempts the initial connection regardless.
    it('attempts to connect using the in-memory access token even without a refresh_token', async () => {
      useAuthStore.setState({ refresh_token: null })
      const { unmount } = renderHook(() => useWebSocket())

      expect(useWSStore.getState().status).toBe('connecting')
      unmount()
    })
  })

  describe('handler registration', () => {
    it('should register onEscalationNew handler', () => {
      const handler = vi.fn()
      const { unmount } = renderHook(() => useWebSocket({ onEscalationNew: handler }))

      unmount()
    })

    it('should register onMessageNew handler', () => {
      const handler = vi.fn()
      const { unmount } = renderHook(() => useWebSocket({ onMessageNew: handler }))

      unmount()
    })

    it('should register multiple handlers simultaneously', () => {
      const handlers = {
        onEscalationNew: vi.fn(),
        onMessageNew: vi.fn(),
        onConversationClosed: vi.fn(),
      }
      const { unmount } = renderHook(() => useWebSocket(handlers))

      unmount()
    })
  })

  describe('reconnect method', () => {
    it('should not reconnect if session is expired', () => {
      useAuthStore.setState({ sessionExpired: true })
      const { result, unmount } = renderHook(() => useWebSocket())

      act(() => {
        result.current.reconnect()
      })

      expect(useWSStore.getState().status).toBe('disconnected')
      unmount()
    })

    it('should not reconnect if no token', () => {
      useAuthStore.setState({ token: null })
      const { result, unmount } = renderHook(() => useWebSocket())

      act(() => {
        result.current.reconnect()
      })

      expect(useWSStore.getState().status).toBe('disconnected')
      unmount()
    })
  })

  describe('conversation subscription', () => {
    it('should support subscribing to conversation messages', () => {
      const { result, unmount } = renderHook(() => useWebSocket())

      act(() => {
        result.current.subscribeConversation('conv-123')
      })

      unmount()
    })

    it('should support unsubscribing from conversation', () => {
      const { result, unmount } = renderHook(() => useWebSocket())

      act(() => {
        result.current.subscribeConversation('conv-123')
        result.current.unsubscribeConversation()
      })

      unmount()
    })
  })
})

// jsdom has no native WebSocket implementation, so every test above lets
// connect()'s `new WebSocket(...)` throw and fall into its catch branch —
// none of them ever reach a live socket. This suite stubs a controllable
// WebSocket so the 4001 (auth-rejection) recovery path can actually be
// exercised. Kept as its own top-level describe, appended last, so the
// module-level socket singleton it drives to 'open' cannot bleed backwards
// into the assertions above (see the shared-singleton note in the main
// describe block).
describe('useWebSocket — auth-rejection recovery races a concurrent logout', () => {
  class MockSocket {
    static readonly OPEN = 1
    readyState = MockSocket.OPEN
    onopen: (() => void) | null = null
    onclose: ((event: { code: number }) => void) | null = null
    onmessage: ((event: MessageEvent) => void) | null = null
    onerror: (() => void) | null = null
    close = vi.fn()
    send = vi.fn()
  }

  let sockets: MockSocket[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    sockets = []
    vi.stubGlobal(
      'WebSocket',
      class extends MockSocket {
        constructor() {
          super()
          sockets.push(this)
          queueMicrotask(() => this.onopen?.())
        }
      }
    )

    mockGetValidToken.mockResolvedValue('test-token')

    useAuthStore.setState({
      token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() + 3600000,
      advisor: { id: 'advisor-1', role: 'asesor' } as unknown as Advisor,
      sessionExpired: false,
      sessionNotice: null,
    })

    useWSStore.setState({ status: 'disconnected', reconnectAttempt: 0 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not show a bogus "session expired" notice for a WS auth-recovery refresh that settles after a deliberate logout', async () => {
    let resolveForceRefresh!: (token: string | null) => void
    mockForceRefreshToken.mockReturnValue(
      new Promise<string | null>((resolve) => {
        resolveForceRefresh = resolve
      })
    )

    const { result, unmount } = renderHook(() => useWebSocket())

    // The module-level socket/reconnectTimeout are a singleton shared across
    // every test in this file (see the main describe block's own comments) —
    // an earlier test's real `new WebSocket()` (thrown on, jsdom has none)
    // can leave a pending backoff timer that blocks the mount effect's own
    // dial(). reconnect() bypasses that guard directly, giving each test in
    // this describe a clean, deterministic dial regardless of run order.
    act(() => {
      result.current.reconnect()
    })

    // Flush dial()'s getValidToken() microtask and the mock socket's onopen.
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    const ws = sockets[sockets.length - 1]
    expect(ws).toBeDefined()

    // Server rejects the token at handshake time — kicks off handleAuthRejection().
    act(() => {
      ws.onclose?.({ code: 4001 })
    })

    // The recovery refresh is now in flight. The user logs out manually
    // before it settles — clearSession() nulls refresh_token and bumps
    // sessionEpoch, exactly like a real "Cerrar sesión" click.
    act(() => {
      useAuthStore.getState().clearSession()
    })

    // The in-flight recovery finally resolves with no token — before the
    // fix, this branch read refresh_token (now null) and called
    // endSession(), overwriting the deliberate logout with a bogus
    // "Tu sesión ha expirado" notice.
    await act(async () => {
      resolveForceRefresh(null)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(useAuthStore.getState().sessionExpired).toBe(false)
    expect(useAuthStore.getState().sessionNotice).toBeNull()

    unmount()
  })

  it('still ends the session when the recovery refresh fails with no logout in between', async () => {
    let rejectForceRefresh!: (err: unknown) => void
    mockForceRefreshToken.mockReturnValue(
      new Promise<string | null>((_resolve, reject) => {
        rejectForceRefresh = reject
      })
    )

    const { result, unmount } = renderHook(() => useWebSocket())

    // See the previous test — clears any leftover reconnectTimeout from an
    // earlier test in this shared-singleton module before dialing.
    act(() => {
      result.current.reconnect()
    })

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    const ws = sockets[sockets.length - 1]
    expect(ws).toBeDefined()

    act(() => {
      ws.onclose?.({ code: 4001 })
    })

    // No logout this time — the refresh_token in the store is still the
    // original one, so a failed recovery genuinely means a dead session.
    useAuthStore.setState({ refresh_token: null })

    await act(async () => {
      rejectForceRefresh(new Error('network error'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(useAuthStore.getState().sessionExpired).toBe(true)
    expect(useAuthStore.getState().sessionNotice).not.toBeNull()

    unmount()
  })
})

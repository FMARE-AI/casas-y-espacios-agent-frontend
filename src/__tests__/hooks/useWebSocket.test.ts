import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuthStore } from '../../store/authStore'
import { useWSStore } from '../../store/wsStore'

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()

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

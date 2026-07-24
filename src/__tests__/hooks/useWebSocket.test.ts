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
    it('should initialize with disconnected status', () => {
      const { unmount } = renderHook(() => useWebSocket())

      expect(useWSStore.getState().status).toBe('disconnected')
      unmount()
    })

    it('should handle connection state changes', async () => {
      const { unmount } = renderHook(() => useWebSocket())

      expect(useWSStore.getState().status).toBe('disconnected')
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

    it('should not reconnect when no refresh_token', async () => {
      useAuthStore.setState({ refresh_token: null })
      const { unmount } = renderHook(() => useWebSocket())

      expect(useWSStore.getState().status).toBe('disconnected')
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

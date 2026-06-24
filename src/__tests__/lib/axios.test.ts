import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import apiClient from '../../lib/axios'

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

describe('axios interceptors', () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>
  let originalAdapter: typeof apiClient.defaults.adapter

  beforeEach(() => {
    resetStore()
    originalAdapter = apiClient.defaults.adapter
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true)
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
    dispatchEventSpy.mockRestore()
  })

  // ── Request interceptor ──

  describe('request interceptor', () => {
    it('adds Authorization header when token exists in store', async () => {
      useAuthStore.getState().setToken('my-jwt-token')

      let capturedAuthHeader: string | undefined

      apiClient.defaults.adapter = async (config) => {
        capturedAuthHeader = config.headers?.Authorization as string | undefined
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      }

      await apiClient.get('/test')

      expect(capturedAuthHeader).toBe('Bearer my-jwt-token')
    })

    it('does NOT add Authorization header when token is null', async () => {
      let capturedAuthHeader: string | undefined

      apiClient.defaults.adapter = async (config) => {
        capturedAuthHeader = config.headers?.Authorization as string | undefined
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      }

      await apiClient.get('/test')

      expect(capturedAuthHeader).toBeUndefined()
    })
  })

  // ── Response interceptor ──

  describe('response interceptor', () => {
    it('dispatches session-expired CustomEvent on 401 response', async () => {
      apiClient.defaults.adapter = async () => {
        const error = new axios.AxiosError(
          'Unauthorized', '401', undefined, undefined,
          { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: {} as never }
        )
        throw error
      }

      try { await apiClient.get('/test') } catch { /* expected */ }

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'session-expired' })
      )
    })

    it('does NOT dispatch event on non-401 errors', async () => {
      apiClient.defaults.adapter = async () => {
        const error = new axios.AxiosError(
          'Internal Server Error', '500', undefined, undefined,
          { status: 500, statusText: 'Internal Server Error', data: {}, headers: {}, config: {} as never }
        )
        throw error
      }

      try { await apiClient.get('/test') } catch { /* expected */ }

      const sessionExpiredCalls = (dispatchEventSpy as Mock).mock.calls.filter(
        ([event]: [Event]) => event instanceof CustomEvent && event.type === 'session-expired'
      )
      expect(sessionExpiredCalls).toHaveLength(0)
    })

    it('still rejects the promise on 401 (does not swallow errors)', async () => {
      apiClient.defaults.adapter = async () => {
        const error = new axios.AxiosError(
          'Unauthorized', '401', undefined, undefined,
          { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: {} as never }
        )
        throw error
      }

      await expect(apiClient.get('/test')).rejects.toThrow()
    })
  })
})

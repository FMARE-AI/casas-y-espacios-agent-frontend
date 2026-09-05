import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import axios, { type AxiosResponse } from 'axios'
import { useAuthStore } from '../../store/authStore'
import apiClient from '../../lib/axios'

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

  describe('request interceptor', () => {
    it('adds Authorization header when token exists in store', async () => {
      useAuthStore.setState({
        token: 'my-jwt-token',
        refresh_token: 'my-refresh-token',
        expires_at: Date.now() + 3600 * 1000,
      })

      let capturedAuthHeader: string | undefined
      apiClient.defaults.adapter = async (config) => {
        capturedAuthHeader = config.headers?.Authorization as string | undefined
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse
      }

      await apiClient.get('/test')

      expect(capturedAuthHeader).toBe('Bearer my-jwt-token')
    })

    it('does NOT add Authorization header when token is null', async () => {
      let capturedAuthHeader: string | undefined
      apiClient.defaults.adapter = async (config) => {
        capturedAuthHeader = config.headers?.Authorization as string | undefined
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse
      }

      await apiClient.get('/test')

      expect(capturedAuthHeader).toBeUndefined()
    })
  })

  describe('response interceptor', () => {
    it('dispatches session-expired CustomEvent on 401 response', async () => {
      // A real axios adapter always populates `error.config` from the config it
      // received (used by the interceptor to distinguish the refresh-token
      // endpoint from a regular request via error.config.url) — mirror that here
      // instead of leaving it empty, otherwise the interceptor reads
      // `originalRequest._retry` off `undefined` and throws before ever reaching
      // the dispatch logic this test is asserting on.
      apiClient.defaults.adapter = async (config) => {
        const err = new axios.AxiosError('Unauthorized')
        err.config = config
        err.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config }
        throw err
      }

      try { await apiClient.get('/test') } catch { /* expected — the refresh attempt this triggers also 401s */ }

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'session-expired' })
      )
    })

    it('does NOT dispatch event on non-401 errors', async () => {
      apiClient.defaults.adapter = async (config) => {
        const err = new axios.AxiosError('Server Error')
        err.config = config
        err.response = { status: 500, statusText: 'Internal Server Error', data: {}, headers: {}, config }
        throw err
      }

      try { await apiClient.get('/test') } catch { /* expected */ }

      const calls = (dispatchEventSpy as Mock).mock.calls.filter(
        (args: unknown[]) => args[0] instanceof CustomEvent && (args[0] as CustomEvent).type === 'session-expired'
      )
      expect(calls).toHaveLength(0)
    })

    it('still rejects the promise on 401 (does not swallow errors)', async () => {
      apiClient.defaults.adapter = async (config) => {
        const err = new axios.AxiosError('Unauthorized')
        err.config = config
        err.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config }
        throw err
      }

      await expect(apiClient.get('/test')).rejects.toThrow()
    })
  })

  // Regression: a token refresh that is still in flight when the session ends
  // used to apply its outcome to whatever session existed by the time it landed.
  // Reproduced in dev against the real backend: a fresh login stayed usable for
  // 29 seconds before the previous session's refresh 401'd and tore it down.
  describe('orphaned refresh (session ended while the refresh was in flight)', () => {
    // Hangs the refresh request until the returned trigger is called, so the
    // test can end the session in the middle of the round trip.
    function suspendRefresh(outcome: 'reject-401' | 'resolve-200') {
      let release: (() => void) | null = null
      const started = new Promise<void>((markStarted) => {
        apiClient.defaults.adapter = async (config) => {
          if (config.url?.includes('/auth/token/refresh')) {
            markStarted()
            await new Promise<void>((r) => { release = r })
            if (outcome === 'reject-401') {
              const err = new axios.AxiosError('Unauthorized')
              err.config = config
              err.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config }
              throw err
            }
            return {
              data: { access_token: 'stale-at', refresh_token: 'stale-rt', expires_in: 3600 },
              status: 200, statusText: 'OK', headers: {}, config,
            } as AxiosResponse
          }
          return { data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse
        }
      })
      return { started, release: () => release?.() }
    }

    // expires_at in the past makes the request interceptor refresh before firing.
    function startRequestNeedingRefresh() {
      useAuthStore.setState({
        token: 'session-a-at',
        refresh_token: 'session-a-rt',
        expires_at: Date.now() - 1,
      })
      return apiClient.get('/test').catch(() => undefined)
    }

    it('does not clear a session created after the refresh was issued', async () => {
      const { started, release } = suspendRefresh('reject-401')
      const inFlight = startRequestNeedingRefresh()
      await started

      // User logs out and logs back in while the refresh is still travelling.
      useAuthStore.getState().clearSession()
      useAuthStore.setState({
        token: 'session-b-at',
        refresh_token: 'session-b-rt',
        expires_at: Date.now() + 3600 * 1000,
      })

      release()
      await inFlight

      expect(useAuthStore.getState().token).toBe('session-b-at')
      expect(useAuthStore.getState().refresh_token).toBe('session-b-rt')
    })

    it('does not dispatch session-expired for a session that no longer exists', async () => {
      const { started, release } = suspendRefresh('reject-401')
      const inFlight = startRequestNeedingRefresh()
      await started

      useAuthStore.getState().clearSession()
      dispatchEventSpy.mockClear()

      release()
      await inFlight

      const calls = (dispatchEventSpy as Mock).mock.calls.filter(
        (args: unknown[]) => args[0] instanceof CustomEvent && (args[0] as CustomEvent).type === 'session-expired'
      )
      expect(calls).toHaveLength(0)
    })

    it('does not install tokens from a refresh that succeeds too late', async () => {
      const { started, release } = suspendRefresh('resolve-200')
      const inFlight = startRequestNeedingRefresh()
      await started

      useAuthStore.getState().clearSession()

      release()
      await inFlight

      // The orphaned 200 must not resurrect a session the user ended.
      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().refresh_token).toBeNull()
    })

    it('still tears the session down when the refresh fails for the CURRENT session', async () => {
      const { started, release } = suspendRefresh('reject-401')
      const inFlight = startRequestNeedingRefresh()
      await started

      dispatchEventSpy.mockClear()
      release()
      await inFlight

      const calls = (dispatchEventSpy as Mock).mock.calls.filter(
        (args: unknown[]) => args[0] instanceof CustomEvent && (args[0] as CustomEvent).type === 'session-expired'
      )
      expect(calls.length).toBeGreaterThan(0)
      expect(useAuthStore.getState().token).toBeNull()
    })
  })
})

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
})

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

function mockAdapter(overrides: Partial<AxiosResponse> = {}) {
  return async (config: Parameters<typeof apiClient.defaults.adapter extends undefined ? never : NonNullable<typeof apiClient.defaults.adapter>>[0]) =>
    ({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      ...overrides,
    } as AxiosResponse)
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
      useAuthStore.getState().setToken('my-jwt-token')

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
      apiClient.defaults.adapter = async () => {
        throw new axios.AxiosError(
          'Unauthorized',
          axios.AxiosError.ERR_BAD_REQUEST,
          undefined,
          undefined,
          { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: {} } as AxiosResponse,
        )
      }

      try { await apiClient.get('/test') } catch { /* expected */ }

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'session-expired' })
      )
    })

    it('does NOT dispatch event on non-401 errors', async () => {
      apiClient.defaults.adapter = async () => {
        throw new axios.AxiosError(
          'Internal Server Error',
          axios.AxiosError.ERR_BAD_RESPONSE,
          undefined,
          undefined,
          { status: 500, statusText: 'Internal Server Error', data: {}, headers: {}, config: {} } as AxiosResponse,
        )
      }

      try { await apiClient.get('/test') } catch { /* expected */ }

      const calls = (dispatchEventSpy as Mock).mock.calls.filter(
        ([event]: [Event]) => event instanceof CustomEvent && event.type === 'session-expired'
      )
      expect(calls).toHaveLength(0)
    })

    it('still rejects the promise on 401 (does not swallow errors)', async () => {
      apiClient.defaults.adapter = async () => {
        throw new axios.AxiosError(
          'Unauthorized',
          axios.AxiosError.ERR_BAD_REQUEST,
          undefined,
          undefined,
          { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: {} } as AxiosResponse,
        )
      }

      await expect(apiClient.get('/test')).rejects.toThrow()
    })
  })
})

import type { AxiosRequestConfig } from 'axios'

// Attaches an AbortSignal to a request config ONLY when one is supplied.
// Callers that don't cancel keep their exact previous config object, so adding
// cancellation to a service never changes the request shape for existing callers.
export function withSignal<T extends AxiosRequestConfig>(config: T, signal?: AbortSignal): T {
  return signal ? { ...config, signal } : config
}

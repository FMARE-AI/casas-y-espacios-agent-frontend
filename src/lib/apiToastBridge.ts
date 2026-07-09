import { useToastStore } from '../store/toastStore'
import type { ToastType } from '../store/toastStore'

// Registers the global 'api-toast' CustomEvent listener at app init.
// axios.ts dispatches this event instead of importing the store directly,
// keeping infrastructure free of React runtime dependencies.
// Returns a cleanup function (used if the app ever needs to teardown).
export function registerApiToastBridge(): () => void {
  const handler = (e: Event) => {
    const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail
    useToastStore.getState().showToast(message, type)
  }
  window.addEventListener('api-toast', handler)
  return () => window.removeEventListener('api-toast', handler)
}

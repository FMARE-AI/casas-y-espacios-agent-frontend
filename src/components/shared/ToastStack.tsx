import { useEffect } from 'react'
import { useToastStore, type Toast, type ToastType } from '../../store/toastStore'

const AUTO_DISMISS_MS = 4000

const STYLES: Record<ToastType, { border: string; bg: string; color: string }> = {
  success: { border: 'border-l-[#00D4AA]', bg: 'bg-[#00D4AA]/10', color: 'text-[#00D4AA]' },
  error:   { border: 'border-l-[#FF5B5B]', bg: 'bg-[#FF5B5B]/10', color: 'text-[#FF5B5B]' },
  warning: { border: 'border-l-[#FFB84D]', bg: 'bg-[#FFB84D]/10', color: 'text-[#FFB84D]' },
  info:    { border: 'border-l-[#01A4E3]', bg: 'bg-[#01A4E3]/10', color: 'text-[#01A4E3]' },
}

const TITLES: Record<ToastType, string> = {
  success: 'Operación Exitosa',
  error:   'Error',
  warning: 'Atención',
  info:    'Información',
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  if (type === 'warning') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Each toast item manages its own auto-dismiss timer.
// timer depends on toast.id (stable per toast) so it fires exactly once per toast.
function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const style = STYLES[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast.id, removeToast])

  return (
    <div
      className={`bg-[#252522] border-l-4 ${style.border} border border-[#3A3A37] rounded-r-lg shadow-2xl p-3.5 w-80 flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right duration-300`}
    >
      <div className={`${style.bg} p-2 rounded-lg ${style.color} shrink-0`}>
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 text-xs min-w-0">
        <h5 className="font-bold text-white">{TITLES[toast.type]}</h5>
        <p className="text-[11px] text-[#8B8FA8] mt-1 break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-[#8B8FA8] hover:text-white shrink-0 mt-0.5"
        aria-label="Cerrar notificación"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Bridge: axios dispatches 'api-toast' CustomEvents (no React dependency in axios.ts).
// This component listens and feeds them into the store.
export default function ToastStack() {
  const toasts = useToastStore((s) => s.toasts)
  const showToast = useToastStore((s) => s.showToast)

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail
      showToast(message, type)
    }
    window.addEventListener('api-toast', handler)
    return () => window.removeEventListener('api-toast', handler)
  }, [showToast])

  if (toasts.length === 0) return null

  return (
    <div
      id="toast-stack"
      className="fixed top-24 right-4 flex flex-col gap-2 z-[998] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

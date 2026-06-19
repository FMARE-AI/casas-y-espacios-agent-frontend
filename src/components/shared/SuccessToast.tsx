import { useEffect } from 'react'
import { useToastStore } from '../../store/toastStore'

const AUTO_DISMISS_MS = 4000

export default function SuccessToast() {
  const { message, show, hideToast } = useToastStore()

  // Auto-dismiss
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(hideToast, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [show, hideToast])

  return (
    <div
      id="operation-success-toast"
      className={`fixed top-24 right-4 bg-[#252522] border-l-4 border-l-[#00D4AA] border border-[#3A3A37] rounded-r-lg shadow-2xl p-3.5 w-80 transition-transform duration-300 ease-out flex items-start gap-3 z-[998] pointer-events-auto ${
        show && message ? 'translate-x-0' : 'translate-x-[400px] pointer-events-none'
      }`}
    >
      <div className="bg-[#00D4AA]/10 p-2 rounded-lg text-[#00D4AA] shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="flex-1 text-xs">
        <h5 className="font-bold text-white" id="success-toast-title">
          Operación Exitosa
        </h5>
        <p className="text-[11px] text-[#8B8FA8] mt-1" id="success-toast-desc">
          {message || ''}
        </p>
      </div>
    </div>
  )
}

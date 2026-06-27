import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWSStore } from '../../store/wsStore'
import { useAuthStore } from '../../store/authStore'

const AUTO_DISMISS_MS = 8000

export default function EscalationToast() {
  const navigate = useNavigate()
  const { pendingEscalation, clearPendingEscalation } = useWSStore()
  const isAdmin = useAuthStore((s) => s.role) === 'admin'

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!pendingEscalation) return
    const timer = setTimeout(clearPendingEscalation, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [pendingEscalation, clearPendingEscalation])

  if (!pendingEscalation) return null

  function handleAttend() {
    if (!pendingEscalation) return
    navigate(`/chat/${pendingEscalation.conversationId}`)
    clearPendingEscalation()
  }

  return (
    <div
      id="new-escalated-toast"
      className="fixed top-24 right-4 bg-[#252522] border-l-4 border-l-[#FF5B5B] border border-[#3A3A37] rounded-r-lg shadow-2xl p-3.5 w-80 transition-transform duration-300 ease-out z-[999] pointer-events-auto animate-in slide-in-from-right"
    >
      <div className="flex items-start gap-3">
        <div className="bg-[#FF5B5B]/10 p-2 rounded-lg text-[#FF5B5B] shrink-0">
          <svg
            className="w-5 h-5 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div className="flex-1 text-xs">
          <div className="flex justify-between items-start">
            <h5 className="font-bold text-white flex items-center gap-1">
              Nueva Escalación 🔔
            </h5>
            <button
              onClick={clearPendingEscalation}
              className="text-[#8B8FA8] hover:text-white"
              aria-label="Close toast"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-[#8B8FA8] mt-1">
            Cliente: <strong className="text-white">{pendingEscalation.clientName}</strong>
          </p>
          <p className="text-[11px] text-[#8B8FA8]">
            Motivo:{' '}
            <span className="text-[#FF5B5B] font-mono font-bold">
              {pendingEscalation.reason}
            </span>
          </p>
          <div className="mt-2.5 flex justify-end gap-2 text-[10px]">
            <button
              onClick={clearPendingEscalation}
              className="px-2 py-1 hover:bg-[#2E2E2B] text-[#8B8FA8] rounded font-bold"
            >
              {isAdmin ? 'Cerrar' : 'Ignorar'}
            </button>
            {!isAdmin && (
              <button
                onClick={handleAttend}
                className="bg-[#01A4E3] text-white px-2.5 py-1 rounded font-bold hover:bg-[#0190C8] transition active:scale-95"
              >
                Atender ya
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'

export default function SessionExpiredModal() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const blockedTitle = useAuthStore((s) => s.blockedTitle)
  const blockedMessage = useAuthStore((s) => s.blockedMessage)

  const title = blockedTitle ?? 'Tu sesión ha expirado'
  const message = blockedMessage ?? 'Por seguridad, tu sesión se cerró automáticamente. Ingresa nuevamente para continuar.'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleGoToLogin = async () => {
    useAuthStore.getState().setSessionExpired(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div
      id="dialog-modal-overlay"
      className="fixed inset-0 bg-bg-main/90 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
    >
      <div
        id="modal-expired-session"
        className="bg-bg-secondary border border-border-default rounded-xl shadow-md p-6 max-w-sm w-full space-y-4"
      >
        <div className="text-center">
          <div className="bg-red-950/40 text-error w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-error/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">{message}</p>
        </div>

        <div className="pt-2 text-xs">
          <button
            onClick={handleGoToLogin}
            className="w-full bg-brand-blue hover:bg-brand-blue-hover text-white py-2.5 rounded font-bold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
          >
            Ir al login
          </button>
        </div>
      </div>
    </div>
  )
}

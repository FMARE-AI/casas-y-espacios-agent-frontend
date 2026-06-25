import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useWSStore } from '../../store/wsStore'
import Sidebar from './Sidebar'
import SessionExpiredModal from '../shared/SessionExpiredModal'
import SuccessToast from '../shared/SuccessToast'
import EscalationToast from '../shared/EscalationToast'
import { useWebSocket } from '../../hooks/useWebSocket'
import type { AdvisorRole, WSStatus } from '../../types'

interface Props {
  requiredRole?: AdvisorRole
}

export default function ProtectedRoute({ requiredRole }: Props) {
  const { token, role, isFirstLogin, sessionExpired } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { reconnect } = useWebSocket()

  if (!token) return <Navigate to="/login" replace />
  if (isFirstLogin) return <Navigate to="/first-login" replace />
  if (requiredRole && role !== null && role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="h-screen overflow-hidden bg-[#1D1D1B] flex">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <MobileHeader onOpenSidebar={() => setMobileOpen(true)} />
        <WSDisconnectedBanner onReconnect={reconnect} />
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {sessionExpired && <SessionExpiredModal />}
      <EscalationToast />
      <SuccessToast />
    </div>
  )
}

function MobileHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const location = useLocation()
  const { role } = useAuthStore()
  const { status: wsStatus } = useWSStore()

  const titleMap: Record<string, string> = {
    '/': 'Bandeja',
    '/historial': 'Historial',
    '/gestion': 'Gestión',
    '/perfil': 'Perfil',
  }

  const getTitle = () => {
    if (location.pathname.startsWith('/chat/')) return 'Chat'
    return titleMap[location.pathname] ?? 'Bandeja'
  }

  const WS_DOT_CLASSES: Record<WSStatus, string> = {
    connected: 'bg-[#01A4E3] ws-pulse-dot',
    reconnecting: 'bg-[#FFB84D]',
    disconnected: 'bg-[#FF5B5B]',
  }

  return (
    <div className="md:hidden flex items-center justify-between bg-[#252522] border-b border-[#3A3A37] px-4 py-3 shrink-0">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="text-[#8B8FA8] hover:text-white p-1 focus:outline-none"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          {getTitle()}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${WS_DOT_CLASSES[wsStatus]}`} />
        <span className="text-[9px] text-[#8B8FA8] uppercase font-bold">
          {role ?? 'Asesor'}
        </span>
      </div>
    </div>
  )
}

function WSDisconnectedBanner({ onReconnect }: { onReconnect: () => void }) {
  const { status } = useWSStore()

  if (status !== 'disconnected') return null

  return (
    <div
      id="ws-disconnected-banner"
      className="bg-gradient-to-r from-[#FF5B5B] to-[#D64545] text-white px-6 py-3.5 text-xs font-semibold flex flex-col sm:flex-row justify-between items-center gap-3 shadow-lg border-b border-[#FF5B5B]/30 z-[99]"
    >
      <div className="flex items-center space-x-3">
        <div className="bg-white/10 p-1.5 rounded-full shrink-0">
          <svg className="w-4 h-4 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <span>
          <strong>Se perdió la conexión en tiempo real.</strong> El canal WebSocket está inactivo y el monitoreo se encuentra en pausa. ¿Deseas reestablecer el túnel?
        </span>
      </div>
      <button
        onClick={onReconnect}
        className="bg-white hover:bg-slate-100 text-black font-bold px-4 py-2 rounded shadow-md hover:shadow-lg transition active:scale-95 text-[10px] uppercase tracking-wide shrink-0"
      >
        Reconectar Canal
      </button>
    </div>
  )
}

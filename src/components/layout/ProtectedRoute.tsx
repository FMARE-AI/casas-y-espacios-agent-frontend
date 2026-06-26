import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useWSStore } from '../../store/wsStore'
import { ROUTES } from '../../constants/routes'
import Sidebar from './Sidebar'
import SessionExpiredModal from '../shared/SessionExpiredModal'
import ToastStack from '../shared/ToastStack'
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

  if (!token) return <Navigate to={ROUTES.LOGIN} replace />
  if (isFirstLogin) return <Navigate to={ROUTES.FIRST_LOGIN} replace />
  if (requiredRole && role !== null && role !== requiredRole) {
    return <Navigate to={ROUTES.BANDEJA} replace />
  }

  return (
    <div className="h-screen overflow-hidden bg-[#1D1D1B] flex">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <MobileHeader onOpenSidebar={() => setMobileOpen(true)} />
        <WSStatusBanner onReconnect={reconnect} />
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {sessionExpired && <SessionExpiredModal />}
      <EscalationToast />
      <ToastStack />
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

function WSStatusBanner({ onReconnect }: { onReconnect: () => void }) {
  const status = useWSStore((s) => s.status)

  if (status === 'disconnected') {
    return (
      <div
        id="ws-disconnected-banner"
        className="fixed top-0 left-0 right-0 bg-[#FF5B5B]/90 backdrop-blur-sm text-white text-xs text-center py-2 z-50 flex items-center justify-center gap-2"
      >
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        Sin conexión — los mensajes pueden no llegar en tiempo real.
        <button
          onClick={onReconnect}
          className="underline ml-1 hover:no-underline"
        >
          Reconectar
        </button>
      </div>
    )
  }

  if (status === 'reconnecting') {
    return (
      <div
        id="ws-reconnecting-banner"
        className="fixed top-0 left-0 right-0 bg-[#FFB84D]/90 backdrop-blur-sm text-white text-xs text-center py-2 z-50 flex items-center justify-center gap-2"
      >
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Reconectando...
      </div>
    )
  }

  return null
}

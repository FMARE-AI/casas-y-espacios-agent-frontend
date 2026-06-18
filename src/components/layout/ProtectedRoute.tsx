// Guard de autenticación y rol para las rutas protegidas.
// Envuelve todas las rutas que requieren sesión activa.

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Sidebar from './Sidebar'
import SessionExpiredModal from '../shared/SessionExpiredModal'
import type { AdvisorRole } from '../../types'

interface Props {
  requiredRole?: AdvisorRole
}

export default function ProtectedRoute({ requiredRole }: Props) {
  const { session, role, isFirstLogin, sessionExpired } = useAuthStore()

  if (!session) return <Navigate to="/login" replace />

  if (isFirstLogin) return <Navigate to="/first-login" replace />

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-[#1D1D1B] flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
      {sessionExpired && <SessionExpiredModal />}
    </div>
  )
}

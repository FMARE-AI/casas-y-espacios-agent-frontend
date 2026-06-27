import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'
import { useWSStore } from './store/wsStore'
import { useToastStore } from './store/toastStore'
import { playNotificationSound } from './hooks/useWebSocket'
import { ROUTES } from './constants/routes'

// Debug helpers — available in all non-production environments via window.__debug
if (import.meta.env.MODE !== 'production') {
  (window as Window & { __debug?: object }).__debug = {
    escalation: (clientName = 'Carlos Mendoza', reason = 'frustracion_detectada', conversationId = 'demo') =>
      useWSStore.getState().setPendingEscalation({ clientName, reason, conversationId }),
    clearEscalation: () => useWSStore.getState().clearPendingEscalation(),
    toast: (message = 'Operación exitosa') => useToastStore.getState().showToast(message),
    sound: () => playNotificationSound(),
    // Equivalent of mockup's setSidebarAlertsBadge(n) — Badge 3 / Badge 0
    alerts: (n = 3) => useWSStore.getState().setUnreadAlerts(n),
    clearAlerts: () => useWSStore.getState().resetAlerts(),
  }
}
import ProtectedRoute from './components/layout/ProtectedRoute'
import { GestionPage } from './pages/GestionPage'
import { LoginPage } from './pages/LoginPage'
import { FirstLoginPage } from './pages/FirstLoginPage'
import BandejaPage from './pages/BandejaPage'
import ChatPage from './pages/ChatPage'
import HistorialPage from './pages/HistorialPage'
import PerfilPage from './pages/PerfilPage'

function AuthInit() {
  useAuth()
  return null
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading, isFirstLogin } = useAuthStore()
  if (isLoading) return null
  if (token) return <Navigate to={isFirstLogin ? ROUTES.FIRST_LOGIN : ROUTES.BANDEJA} replace />
  return <>{children}</>
}

function FirstLoginRoute() {
  const { token, isLoading, isFirstLogin } = useAuthStore()
  if (isLoading) return null
  if (!token) return <Navigate to={ROUTES.LOGIN} replace />
  if (!isFirstLogin) return <Navigate to={ROUTES.BANDEJA} replace />
  return <FirstLoginPage />
}

export default function App() {
  const { isLoading } = useAuthStore()

  return (
    <BrowserRouter>
      <AuthInit />

      {isLoading ? (
        <div className="min-h-screen bg-[#1D1D1B] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Routes>
          {/* Public routes */}
          <Route
            path={ROUTES.LOGIN}
            element={<PublicRoute><LoginPage /></PublicRoute>}
          />
          <Route path={ROUTES.FIRST_LOGIN} element={<FirstLoginRoute />} />

          {/* Protected routes — any role */}
          <Route element={<ProtectedRoute />}>
            <Route path={ROUTES.BANDEJA} element={<BandejaPage />} />
            <Route path={ROUTES.CHAT} element={<ChatPage />} />
            <Route path="/historial" element={<HistorialPage />} />
            <Route path={ROUTES.PERFIL} element={<PerfilPage />} />
          </Route>

          {/* Protected routes — admin only */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path={ROUTES.GESTION} element={<GestionPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={ROUTES.BANDEJA} replace />} />
        </Routes>
      )}

    </BrowserRouter>
  )
}

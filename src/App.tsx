import { Suspense, lazy } from 'react'
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
    escalation: (clientName = 'Carlos Mendoza', reason = 'frustracion_detectada', conversationId = 'demo', advisorId = null, channel = 'administrativa') =>
      useWSStore.getState().setPendingEscalation({ clientName, reason, conversationId, advisorId, channel }),
    clearEscalation: () => useWSStore.getState().clearPendingEscalation(),
    toast: (message = 'Operación exitosa') => useToastStore.getState().showToast(message),
    sound: () => playNotificationSound(),
    // Equivalent of mockup's setSidebarAlertsBadge(n) — Badge 3 / Badge 0
    alerts: (n = 3) => useWSStore.getState().setUnreadAlerts(n),
    clearAlerts: () => useWSStore.getState().resetAlerts(),
  }
}
import ProtectedRoute from './components/layout/ProtectedRoute'
import IdleLogoutGuard from './components/shared/IdleLogoutGuard'
import { LoginPage } from './pages/LoginPage'
import { FirstLoginPage } from './pages/FirstLoginPage'

// Lazy-loaded pages for code splitting
const GestionPage = lazy(() => import('./pages/GestionPage'))
const BandejaPage = lazy(() => import('./pages/BandejaPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const HistorialPage = lazy(() => import('./pages/HistorialPage'))
const ContactosPage = lazy(() => import('./pages/ContactosPage'))
const PerfilPage = lazy(() => import('./pages/PerfilPage'))

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

function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const { isLoading } = useAuthStore()

  return (
    <BrowserRouter>
      <AuthInit />
      <IdleLogoutGuard />

      {isLoading ? (
        <div className="min-h-screen bg-bg-main flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Suspense fallback={<PageLoadingFallback />}>
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
              <Route path={ROUTES.CONTACTOS} element={<ContactosPage />} />
              <Route path={ROUTES.PERFIL} element={<PerfilPage />} />
            </Route>

            {/* Protected routes — admin only */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path={ROUTES.GESTION} element={<GestionPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to={ROUTES.BANDEJA} replace />} />
          </Routes>
        </Suspense>
      )}

    </BrowserRouter>
  )
}

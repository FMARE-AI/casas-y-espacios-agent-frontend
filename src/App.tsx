import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'
import { ROUTES } from './constants/routes'
import { ProtectedRoute } from './components/ProtectedRoute'
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
  const { session, isLoading, isFirstLogin } = useAuthStore()
  if (isLoading) return (
    <div className="min-h-screen bg-[#1D1D1B] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (session) return <Navigate to={isFirstLogin ? ROUTES.FIRST_LOGIN : ROUTES.GESTION} replace />
  return <>{children}</>
}

function FirstLoginRoute() {
  const { session, isLoading, isFirstLogin } = useAuthStore()
  if (isLoading) return null
  if (!session) return <Navigate to={ROUTES.LOGIN} replace />
  if (!isFirstLogin) return <Navigate to={ROUTES.GESTION} replace />
  return <FirstLoginPage />
}

function App() {
  return (
    <BrowserRouter>
      <AuthInit />
      <Routes>
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
        <Route
          path={ROUTES.GESTION}
          element={
            <ProtectedRoute requiredRole="admin">
              <GestionPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#252522',
            border: '1px solid #3A3A37',
            color: '#F0F0F5',
          },
        }}
      />
    </BrowserRouter>
  )
}

export default App

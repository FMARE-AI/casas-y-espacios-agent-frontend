import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ROUTES } from './constants/routes'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GestionPage } from './pages/GestionPage'
import { LoginPage } from './pages/LoginPage'
import { FirstLoginPage } from './pages/FirstLoginPage'
import { useAuth } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'

function AuthInit() {
  useAuth()
  return null
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading, isFirstLogin } = useAuthStore()
  if (isLoading) return null
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
        <Route
          path={ROUTES.GESTION}
          element={
            <ProtectedRoute requiredRole="admin">
              <GestionPage />
            </ProtectedRoute>
          }
        />
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
  
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import { ROUTES } from './constants/routes'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GestionPage } from './pages/GestionPage'
import LoginPage from './pages/LoginPage'
import FirstLoginPage from './pages/FirstLoginPage'
import BandejaPage from './pages/BandejaPage'
import ChatPage from './pages/ChatPage'
import HistorialPage from './pages/HistorialPage'
import PerfilPage from './pages/PerfilPage'

function AppContent() {
  useAuth() // inicializa Supabase auth y sincroniza el store

  return (
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FIRST_LOGIN} element={<FirstLoginPage />} />

        {/* Rutas protegidas — cualquier rol */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.BANDEJA} element={<BandejaPage />} />
          <Route path={ROUTES.CHAT} element={<ChatPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          <Route path={ROUTES.PERFIL} element={<PerfilPage />} />
        </Route>

        {/* Rutas protegidas — solo admin */}
        <Route
          path={ROUTES.GESTION}
          element={
            <ProtectedRoute requiredRole="admin">
              <GestionPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={ROUTES.BANDEJA} replace />} />
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
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

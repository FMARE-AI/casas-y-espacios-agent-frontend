// Router principal de la aplicación.
// Define todas las rutas y sus guards de autenticación y rol.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import FirstLoginPage from './pages/FirstLoginPage'
import BandejaPage from './pages/BandejaPage'
import ChatPage from './pages/ChatPage'
import HistorialPage from './pages/HistorialPage'
import GestionPage from './pages/GestionPage'
import PerfilPage from './pages/PerfilPage'

function AppRoutes() {
  useAuth() // inicializa Supabase auth y sincroniza el store

  const { isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1D1D1B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/first-login" element={<FirstLoginPage />} />

      {/* Rutas protegidas — cualquier rol */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<BandejaPage />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/historial" element={<HistorialPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
      </Route>

      {/* Rutas protegidas — solo admin */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/gestion" element={<GestionPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

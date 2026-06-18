import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ROUTES } from './constants/routes'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GestionPage } from './pages/GestionPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login</div>} />
        <Route
          element={
            <ProtectedRoute requiredRole="admin">
              <GestionPage />
            </ProtectedRoute>
          }
          path={ROUTES.GESTION}
        />
        <Route path="*" element={<Navigate to={ROUTES.GESTION} replace />} />
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

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

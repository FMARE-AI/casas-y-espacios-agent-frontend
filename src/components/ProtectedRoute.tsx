import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  requiredRole?: 'asesor' | 'admin'
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  children,
}) => {
  const { session, role, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1D1D1B]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#01A4E3] border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Solo aplicar el check de rol cuando el advisor esté cargado desde el backend
  if (requiredRole && role !== null && role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

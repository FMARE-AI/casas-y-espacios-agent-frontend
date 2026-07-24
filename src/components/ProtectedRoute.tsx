import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  requiredRole?: 'asesor' | 'admin'
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  children,
}) => {
  const { token, role, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1D1D1B]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#01A4E3] border-t-transparent" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Only apply role check when the advisor is loaded from the backend
  if (requiredRole && role !== null && role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  // Bypass authentication in test mode (never in production)
  const isTestMode = import.meta.env.MODE !== 'production' && import.meta.env.VITE_TEST_MODE === 'true'
  
  if (isTestMode) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors">
        <div
          role="status"
          aria-label="Loading authentication"
          className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"
        />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

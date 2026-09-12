import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { ThemeProvider } from './features/theme/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FollowProvider } from './features/users/FollowContext'
import { LikeProvider } from './features/recipes/LikeContext'
import { SavedRecipesProvider } from './features/recipes/SavedRecipesContext'
import { NotificationProvider } from './features/notifications/NotificationContext'
import './App.css'

const Login = lazy(() => import('./features/auth/Login').then(m => ({ default: m.Login })))
const Register = lazy(() => import('./features/auth/Register').then(m => ({ default: m.Register })))
const DashboardLayout = lazy(() => import('./components/Layout/DashboardLayout').then(m => ({ default: m.DashboardLayout })))
const RecipeDetail = lazy(() => import('./features/recipes/RecipeDetail').then(m => ({ default: m.RecipeDetail })))
const UserProfilePage = lazy(() => import('./features/users/UserProfilePage').then(m => ({ default: m.UserProfilePage })))

const LoadingFallback = () => (
  <div
    role="status"
    aria-label="Loading page content"
    className="flex flex-col items-center justify-center min-h-[60vh]"
  >
    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    <span className="sr-only">Loading page content...</span>
  </div>
)

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingFallback />
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes location={location} key={location.pathname}>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Login />
            </motion.div>
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Register />
            </motion.div>
          </PublicRoute>
        } 
      />
      <Route
        path="/dashboard/*"
        element={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          </motion.div>
        }
      />
      <Route
        path="/user/:uid"
        element={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          </motion.div>
        }
      />
      <Route
        path="/recipes/:id"
        element={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <RecipeDetail />
          </motion.div>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <FollowProvider>
            <LikeProvider>
              <SavedRecipesProvider>
                <NotificationProvider>
                  <Toaster position="top-right" richColors />
                  <ErrorBoundary>
                    <AnimatedRoutes />
                  </ErrorBoundary>
                </NotificationProvider>
              </SavedRecipesProvider>
            </LikeProvider>
          </FollowProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

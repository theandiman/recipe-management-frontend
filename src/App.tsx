import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { AuthProvider } from './features/auth/AuthContext'
import { ThemeProvider } from './features/theme/ThemeContext'
import { Login } from './features/auth/Login'
import { Register } from './features/auth/Register'
import { DashboardLayout } from './components/Layout/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RecipeDetail } from './features/recipes/RecipeDetail'
import { UserProfilePage } from './features/users/UserProfilePage'
import { FollowProvider } from './features/users/FollowContext'
import { LikeProvider } from './features/recipes/LikeContext'
import './App.css'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <Routes location={location} key={location.pathname}>
      <Route 
        path="/login" 
        element={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Login />
          </motion.div>
        } 
      />
      <Route 
        path="/register" 
        element={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Register />
          </motion.div>
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <FollowProvider>
            <LikeProvider>
              <Toaster position="top-right" richColors />
              <AnimatedRoutes />
            </LikeProvider>
          </FollowProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

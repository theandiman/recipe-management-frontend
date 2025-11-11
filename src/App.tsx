import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { Login } from './features/auth/Login'
import { Register } from './features/auth/Register'
import { DashboardLayout } from './components/Layout/DashboardLayout'
import { RecipeLibrary } from './features/recipes/RecipeLibrary'
import { RecipeDetail } from './features/recipes/RecipeDetail'
import { CreateRecipe } from './features/recipes/CreateRecipe'
import { AIGenerator } from './features/recipes/AIGenerator'
import { Preferences } from './features/preferences/Preferences'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard/recipes" replace />} />
            <Route path="recipes" element={<RecipeLibrary />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="create" element={<CreateRecipe />} />
            <Route path="generate" element={<AIGenerator />} />
            <Route path="preferences" element={<Preferences />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

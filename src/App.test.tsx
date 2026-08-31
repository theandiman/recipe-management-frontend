import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock all the components used in App
vi.mock('./features/auth/Login', () => ({
  Login: () => <div data-testid="login-page">Login Page</div>
}))

vi.mock('./features/auth/Register', () => ({
  Register: () => <div data-testid="register-page">Register Page</div>
}))

vi.mock('./components/Layout/DashboardLayout', () => ({
  DashboardLayout: () => <div data-testid="dashboard-layout">Dashboard Layout</div>
}))

vi.mock('./features/recipes/RecipeDetail', () => ({
  RecipeDetail: () => <div data-testid="recipe-detail-public">Recipe Detail</div>
}))

vi.mock('./features/recipes/SavedRecipesContext', () => ({
  SavedRecipesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./features/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    loginWithGoogle: vi.fn()
  })
}))

vi.mock('./components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}))

describe('App', () => {
  it('should render without crashing', async () => {
    render(<App />)
    expect(await screen.findByTestId('auth-provider')).toBeInTheDocument()
  })

  it('should wrap app in AuthProvider', async () => {
    render(<App />)
    expect(await screen.findByTestId('auth-provider')).toBeInTheDocument()
  })

  it('should render login page when navigating to /login', async () => {
    window.history.pushState({}, 'Login', '/login')
    render(<App />)
    expect(await screen.findByTestId('login-page')).toBeInTheDocument()
  })

  it('should render register page when navigating to /register', async () => {
    window.history.pushState({}, 'Register', '/register')
    render(<App />)
    expect(await screen.findByTestId('register-page')).toBeInTheDocument()
  })

  it('should render protected dashboard layout when navigating to /dashboard', async () => {
    window.history.pushState({}, 'Dashboard', '/dashboard')
    render(<App />)
    expect(await screen.findByTestId('protected-route')).toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-layout')).toBeInTheDocument()
  })

  it('should redirect from root to /dashboard', async () => {
    window.history.pushState({}, 'Home', '/')
    render(<App />)
    // Should attempt to render dashboard (which will be protected)
    expect(await screen.findByTestId('protected-route')).toBeInTheDocument()
  })

  it('should redirect unknown paths to /dashboard', async () => {
    window.history.pushState({}, 'Unknown', '/does-not-exist')
    render(<App />)
    // Catch-all route should redirect to /dashboard (protected)
    expect(await screen.findByTestId('protected-route')).toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-layout')).toBeInTheDocument()
  })

  it('should render public recipe detail without authentication when navigating to /recipes/:id', async () => {
    window.history.pushState({}, 'Public Recipe', '/recipes/test-recipe-123')
    render(<App />)
    expect(await screen.findByTestId('recipe-detail-public')).toBeInTheDocument()
    // The public route must NOT be wrapped in a ProtectedRoute
    expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument()
  })
})

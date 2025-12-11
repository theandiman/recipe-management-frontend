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
  it('should render without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
  })

  it('should wrap app in AuthProvider', () => {
    render(<App />)
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
  })

  it('should render login page when navigating to /login', () => {
    window.history.pushState({}, 'Login', '/login')
    render(<App />)
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('should render register page when navigating to /register', () => {
    window.history.pushState({}, 'Register', '/register')
    render(<App />)
    expect(screen.getByTestId('register-page')).toBeInTheDocument()
  })

  it('should render protected dashboard layout when navigating to /dashboard', () => {
    window.history.pushState({}, 'Dashboard', '/dashboard')
    render(<App />)
    expect(screen.getByTestId('protected-route')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
  })

  it('should redirect from root to /dashboard', () => {
    window.history.pushState({}, 'Home', '/')
    render(<App />)
    // Should attempt to render dashboard (which will be protected)
    expect(screen.getByTestId('protected-route')).toBeInTheDocument()
  })
})

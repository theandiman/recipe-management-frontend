import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  default: () => <div data-testid="dashboard-layout">Dashboard Layout</div>,
  DashboardLayout: () => <div data-testid="dashboard-layout">Dashboard Layout</div>
}))

vi.mock('./features/recipes/RecipeDetail', () => ({
  RecipeDetail: () => <div data-testid="recipe-detail-public">Recipe Detail</div>
}))

vi.mock('./features/recipes/SavedRecipesContext', () => ({
  SavedRecipesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./features/notifications/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    fetchNotifications: vi.fn(),
    markItemRead: vi.fn(),
    markAllRead: vi.fn(),
  }),
}))

import type { User } from './types/auth'

const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null as User | null,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  loginWithGoogle: vi.fn(),
  refreshUser: vi.fn(),
}

vi.mock('./features/auth/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (val: any) => React.ReactNode }) => children(mockAuthState),
  },
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => mockAuthState,
}))

vi.mock('./components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
}))

vi.mock('./components/PublicRoute', () => ({
  PublicRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="public-route">{children}</div>,
}))

describe('App', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = false
    mockAuthState.isLoading = false
    mockAuthState.user = null
  })

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

  it('should redirect from root to /login when unauthenticated', async () => {
    mockAuthState.isAuthenticated = false
    window.history.pushState({}, 'Home', '/')
    render(<App />)
    expect(await screen.findByTestId('login-page')).toBeInTheDocument()
  })

  it('should redirect from root to /dashboard when authenticated', async () => {
    mockAuthState.isAuthenticated = true
    mockAuthState.user = { uid: '123', email: 'user@example.com', displayName: 'Chef Andy', photoURL: null }
    window.history.pushState({}, 'Home', '/')
    render(<App />)
    expect(await screen.findByTestId('protected-route')).toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-layout')).toBeInTheDocument()
  })

  it('should redirect unknown paths to /login when unauthenticated', async () => {
    mockAuthState.isAuthenticated = false
    window.history.pushState({}, 'Unknown', '/does-not-exist')
    render(<App />)
    expect(await screen.findByTestId('login-page')).toBeInTheDocument()
  })

  it('should render public recipe detail without authentication when navigating to /recipes/:id', async () => {
    window.history.pushState({}, 'Public Recipe', '/recipes/test-recipe-123')
    render(<App />)
    expect(await screen.findByTestId('recipe-detail-public')).toBeInTheDocument()
    // The public route must NOT be wrapped in a ProtectedRoute
    expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument()
  })
})

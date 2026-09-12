import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { PublicRoute } from './PublicRoute'
import * as AuthContext from '../features/auth/AuthContext'

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  }
})

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_TEST_MODE', 'false')
  })

  it('renders children when user is not authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <BrowserRouter>
        <PublicRoute>
          <div>Public Form</div>
        </PublicRoute>
      </BrowserRouter>
    )

    expect(screen.getByText('Public Form')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('redirects to /dashboard when user is authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { uid: '123', email: 'user@example.com', displayName: 'User', photoURL: null },
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <BrowserRouter>
        <PublicRoute>
          <div>Public Form</div>
        </PublicRoute>
      </BrowserRouter>
    )

    expect(screen.getByTestId('navigate')).toHaveTextContent('/dashboard')
    expect(screen.queryByText('Public Form')).not.toBeInTheDocument()
  })

  it('shows loading spinner while checking authentication', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <BrowserRouter>
        <PublicRoute>
          <div>Public Form</div>
        </PublicRoute>
      </BrowserRouter>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Public Form')).not.toBeInTheDocument()
  })
})

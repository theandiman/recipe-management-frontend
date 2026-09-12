import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { DashboardGreeting } from '../DashboardGreeting'
import * as AuthContext from '../../../features/auth/AuthContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('DashboardGreeting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders greeting with user display name', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        uid: 'user-1',
        email: 'alice@example.com',
        displayName: 'Chef Alice',
        photoURL: null,
      },
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <BrowserRouter>
        <DashboardGreeting />
      </BrowserRouter>
    )

    expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument()
    expect(screen.getByText('Chef Alice')).toBeInTheDocument()
  })

  it('falls back to email prefix if display name is missing', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        uid: 'user-2',
        email: 'bob@example.com',
        displayName: null,
        photoURL: null,
      },
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      refreshUser: vi.fn(),
    })

    render(
      <BrowserRouter>
        <DashboardGreeting />
      </BrowserRouter>
    )

    expect(screen.getByText('bob')).toBeInTheDocument()
  })

  it('navigates to /dashboard/create on Create Recipe button click', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: true,
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
        <DashboardGreeting />
      </BrowserRouter>
    )

    const createButton = screen.getByRole('button', { name: /Create Recipe/i })
    fireEvent.click(createButton)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/create')
  })

  it('navigates to /dashboard/generate on Generate with AI button click', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: true,
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
        <DashboardGreeting />
      </BrowserRouter>
    )

    const aiButton = screen.getByRole('button', { name: /Generate with AI/i })
    fireEvent.click(aiButton)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/generate')
  })
})

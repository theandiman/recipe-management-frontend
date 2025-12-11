import { describe, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Login } from './Login'
import { useAuth } from './AuthContext'

vi.mock('./AuthContext')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

describe('Login', () => {
  it('should render login form', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn()
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    screen.getByLabelText(/email/i)
    screen.getByLabelText(/password/i)
  })

  it('should display error from auth context', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: 'Invalid credentials',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn()
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    screen.getByText('Invalid credentials')
  })

  it('should show loading state', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn()
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    screen.getByRole('button', { name: /sign in/i })
  })
})

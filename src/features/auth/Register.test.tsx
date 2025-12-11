import { describe, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Register } from './Register'
import { useAuth } from './AuthContext'

vi.mock('./AuthContext')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

describe('Register', () => {
  it('should render registration form', () => {
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
        <Register />
      </BrowserRouter>
    )

    screen.getByLabelText(/name/i)
    screen.getByLabelText(/email/i)
    screen.getByLabelText(/password/i)
  })

  it('should display error from auth context', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: 'Email already in use',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn()
    })

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    screen.getByText('Email already in use')
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
        <Register />
      </BrowserRouter>
    )

    screen.getByRole('button', { name: /create account/i })
  })
})

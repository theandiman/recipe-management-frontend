import { describe, it, vi, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Login } from './Login'
import * as AuthContextModule from './AuthContext'

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn()
}))

describe('Login Component', () => {
  const mockLogin = vi.fn()
  const mockLoginWithGoogle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      loginWithGoogle: mockLoginWithGoogle,
      register: vi.fn(),
      logout: vi.fn(),
    })
  })

  it('renders login form inputs and submit button', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeDefined()
  })

  it('calls login handler with credentials on form submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined)

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'secret123' }
    })

    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123'
      })
    })
  })
})

import { describe, it, vi, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Register } from './Register'
import * as AuthContextModule from './AuthContext'

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn()
}))

describe('Register Component', () => {
  const mockRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
    })
  })

  it('renders registration fields and submit button', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/john doe/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined()
  })

  it('calls register handler when form submitted', async () => {
    mockRegister.mockResolvedValueOnce(undefined)

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/john doe/i), {
      target: { value: 'Chef Andy' }
    })
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'andy@example.com' }
    })
    
    const passwordInput = screen.getByPlaceholderText(/••••••••/i)
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Chef Andy',
        email: 'andy@example.com',
        password: 'Password123!'
      })
    })
  })
})

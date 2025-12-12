import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import * as firebaseAuth from 'firebase/auth'
import React from 'react'

// Mock Firebase
vi.mock('../../config/firebase', () => ({
  auth: {}
}))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn()
}))

vi.mock('../../utils/firebaseErrors', () => ({
  getFirebaseErrorMessage: (err: any) => err?.message || 'An error occurred'
}))

// Test component to use the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth()
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="error">{error || 'null'}</div>
    </div>
  )
}

// Test component with actions
const TestComponentWithActions = () => {
  const auth = useAuth()
  
  return (
    <div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="loading">{auth.isLoading ? 'true' : 'false'}</div>
      <div data-testid="user">{auth.user ? auth.user.email : 'null'}</div>
      <div data-testid="error">{auth.error || 'null'}</div>
      <button onClick={() => auth.login({ email: 'test@example.com', password: 'password' })}>Login</button>
      <button onClick={() => auth.loginWithGoogle()}>Login with Google</button>
      <button onClick={() => auth.register({ name: 'Test', email: 'test@example.com', password: 'password' })}>Register</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock onAuthStateChanged to not trigger automatically
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_auth, _callback) => {
      // Don't call callback immediately
      return vi.fn() // Return unsubscribe function
    })
  })

  it('should provide auth context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleError.mockRestore()
  })

  it('should initialize with loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
  })

  it('should handle user authentication state changes', async () => {
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null
    }

    // Mock onAuthStateChanged to call callback with user
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_auth, callback) => {
      if (typeof callback === 'function') {
        callback(mockUser as any)
      }
      return vi.fn()
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('should handle logout state changes', async () => {
    // Mock onAuthStateChanged to call callback with null (logged out)
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_auth, callback) => {
      if (typeof callback === 'function') {
        callback(null as any)
      }
      return vi.fn()
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('should cleanup auth listener on unmount', () => {
    const unsubscribe = vi.fn()
    vi.mocked(firebaseAuth.onAuthStateChanged).mockReturnValue(unsubscribe)

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })

  describe('login', () => {
    it('should successfully login with email and password', async () => {
      const mockUser = {
        uid: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null
      }

      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser
      } as any)

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      )

      const loginButton = screen.getByText('Login')
      await act(async () => {
        loginButton.click()
        await vi.waitFor(() => {}, { timeout: 100 })
      })

      // Check that no error was set
      expect(screen.getByTestId('error')).toHaveTextContent('null')
    })

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials')
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValue(error)

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      )

      const loginButton = screen.getByText('Login')
      await act(async () => {
        try {
          loginButton.click()
        } catch {
          // Expected error
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
      })
    })
  })

  describe('loginWithGoogle', () => {
    it('should successfully login with Google', async () => {
      const mockUser = {
        uid: '123',
        email: 'test@gmail.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      }

      vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValue({
        user: mockUser
      } as any)

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      )

      const googleButton = screen.getByText('Login with Google')
      googleButton.click()
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('null')
      })

      // Check that no error was set
      expect(screen.getByTestId('error')).toHaveTextContent('null')
    })

    it('should handle Google login errors', async () => {
      const error = new Error('Google login failed')
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValue(error)

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      )

      const googleButton = screen.getByText('Login with Google')
      await act(async () => {
        try {
          googleButton.click()
        } catch {
          // Expected error
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Google login failed')
      })
      
      consoleError.mockRestore()
    })
  })

  describe('register', () => {
    it('should successfully register new user', async () => {
      const mockUser = {
        uid: '123',
        email: 'newuser@example.com',
        displayName: null,
        photoURL: null
      }

      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser
      } as any)
      vi.mocked(firebaseAuth.updateProfile).mockResolvedValue(undefined)

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      )

      const registerButton = screen.getByText('Register')
      await act(async () => {
        registerButton.click()
      })
      await waitFor(() => {
        expect(firebaseAuth.updateProfile).toHaveBeenCalled()
      })

      // Check that no error was set and updateProfile was called
      expect(screen.getByTestId('error')).toHaveTextContent('null')
      expect(firebaseAuth.updateProfile).toHaveBeenCalled()
    })

    it('should handle registration errors', async () => {
      const error = new Error('Email already in use')
      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValue(error)

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      )

      const registerButton = screen.getByText('Register')
      await act(async () => {
        try {
          registerButton.click()
        } catch {
          // Expected error
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already in use')
      })
    })
  })

  describe('logout', () => {
    it('should successfully logout', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValue(undefined)

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      )

      const logoutButton = screen.getByText('Logout')
      await act(async () => {
        logoutButton.click()
        await vi.waitFor(() => {}, { timeout: 100 })
      })

      // Check that signOut was called
      expect(firebaseAuth.signOut).toHaveBeenCalled()
    })

    it('should handle logout errors', async () => {
      const error = new Error('Logout failed')
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.mocked(firebaseAuth.signOut).mockRejectedValue(error)

      render(
        <AuthProvider>
          <TestComponentWithActions />
        </AuthProvider>
      )

      const logoutButton = screen.getByText('Logout')
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Logout failed')
      })
      
      consoleError.mockRestore()
    })
  })
})

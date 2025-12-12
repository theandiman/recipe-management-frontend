import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useGoogleSignIn } from '../useGoogleSignIn'
import * as AuthContext from '../../AuthContext'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('useGoogleSignIn', () => {
  it('should call loginWithGoogle and navigate on success', async () => {
    const mockLoginWithGoogle = vi.fn().mockResolvedValue(undefined)

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      loginWithGoogle: mockLoginWithGoogle,
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn()
    })

    const { result } = renderHook(() => useGoogleSignIn(), {
      wrapper: BrowserRouter
    })

    await result.current.handleGoogleSignIn()

    expect(mockLoginWithGoogle).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should handle errors during Google sign-in', async () => {
    const mockLoginWithGoogle = vi.fn().mockRejectedValue(new Error('Google sign-in failed'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      loginWithGoogle: mockLoginWithGoogle,
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn()
    })

    const { result } = renderHook(() => useGoogleSignIn(), {
      wrapper: BrowserRouter
    })

    await result.current.handleGoogleSignIn()

    expect(consoleErrorSpy).toHaveBeenCalledWith('Google sign-in failed:', expect.any(Error))
    consoleErrorSpy.mockRestore()
  })
})

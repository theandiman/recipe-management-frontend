import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export function useGoogleSignIn() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      // Error is handled by context
      console.error('Google sign-in failed:', err)
    }
  }, [loginWithGoogle, navigate])

  return { handleGoogleSignIn }
}

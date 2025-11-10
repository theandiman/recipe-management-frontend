import { FirebaseError } from 'firebase/app'

/**
 * Converts Firebase Auth error codes to user-friendly messages
 */
export const getFirebaseErrorMessage = (error: unknown): string => {
  if (!(error instanceof FirebaseError)) {
    return 'An unexpected error occurred'
  }

  switch (error.code) {
    // Auth errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password'
    
    case 'auth/email-already-in-use':
      return 'An account with this email already exists'
    
    case 'auth/weak-password':
      return 'Password should be at least 6 characters'
    
    case 'auth/invalid-email':
      return 'Invalid email address'
    
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is not enabled'
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later'
    
    case 'auth/user-disabled':
      return 'This account has been disabled'
    
    case 'auth/requires-recent-login':
      return 'Please log in again to complete this action'
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection'
    
    // Default
    default:
      console.error('Unhandled Firebase error:', error.code, error.message)
      return error.message || 'An error occurred'
  }
}

import { describe, it, expect, vi } from 'vitest'
import { FirebaseError } from 'firebase/app'
import { getFirebaseErrorMessage } from './firebaseErrors'

describe('firebaseErrors', () => {
  describe('getFirebaseErrorMessage', () => {
    it('should return user-friendly message for invalid credentials', () => {
      const error = new FirebaseError('auth/user-not-found', 'User not found')
      expect(getFirebaseErrorMessage(error)).toBe('Invalid email or password')
    })

    it('should return user-friendly message for wrong password', () => {
      const error = new FirebaseError('auth/wrong-password', 'Wrong password')
      expect(getFirebaseErrorMessage(error)).toBe('Invalid email or password')
    })

    it('should return user-friendly message for email already in use', () => {
      const error = new FirebaseError('auth/email-already-in-use', 'Email already in use')
      expect(getFirebaseErrorMessage(error)).toBe('An account with this email already exists')
    })

    it('should return user-friendly message for weak password', () => {
      const error = new FirebaseError('auth/weak-password', 'Weak password')
      expect(getFirebaseErrorMessage(error)).toBe('Password should be at least 6 characters')
    })

    it('should return user-friendly message for invalid email', () => {
      const error = new FirebaseError('auth/invalid-email', 'Invalid email')
      expect(getFirebaseErrorMessage(error)).toBe('Invalid email address')
    })

    it('should return user-friendly message for operation not allowed', () => {
      const error = new FirebaseError('auth/operation-not-allowed', 'Operation not allowed')
      expect(getFirebaseErrorMessage(error)).toBe('Email/password authentication is not enabled')
    })

    it('should return user-friendly message for unauthorized domain', () => {
      const error = new FirebaseError('auth/unauthorized-domain', 'Unauthorized domain')
      expect(getFirebaseErrorMessage(error)).toBe('This domain is not authorized for OAuth. Please add it to Firebase Console → Authentication → Settings → Authorized domains')
    })

    it('should return user-friendly message for popup blocked', () => {
      const error = new FirebaseError('auth/popup-blocked', 'Popup blocked')
      expect(getFirebaseErrorMessage(error)).toBe('Sign-in popup was blocked. Please allow popups for this site')
    })

    it('should return user-friendly message for popup closed by user', () => {
      const error = new FirebaseError('auth/popup-closed-by-user', 'Popup closed')
      expect(getFirebaseErrorMessage(error)).toBe('Sign-in was cancelled')
    })

    it('should return user-friendly message for cancelled popup request', () => {
      const error = new FirebaseError('auth/cancelled-popup-request', 'Cancelled')
      expect(getFirebaseErrorMessage(error)).toBe('Sign-in was cancelled')
    })

    it('should return user-friendly message for too many requests', () => {
      const error = new FirebaseError('auth/too-many-requests', 'Too many requests')
      expect(getFirebaseErrorMessage(error)).toBe('Too many failed attempts. Please try again later')
    })

    it('should return user-friendly message for disabled user', () => {
      const error = new FirebaseError('auth/user-disabled', 'User disabled')
      expect(getFirebaseErrorMessage(error)).toBe('This account has been disabled')
    })

    it('should return user-friendly message for requires recent login', () => {
      const error = new FirebaseError('auth/requires-recent-login', 'Requires recent login')
      expect(getFirebaseErrorMessage(error)).toBe('Please log in again to complete this action')
    })

    it('should return user-friendly message for network error', () => {
      const error = new FirebaseError('auth/network-request-failed', 'Network error')
      expect(getFirebaseErrorMessage(error)).toBe('Network error. Please check your connection')
    })

    it('should return error message for unhandled Firebase error codes', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new FirebaseError('auth/unknown-error', 'Some unknown error occurred')
      
      const result = getFirebaseErrorMessage(error)
      
      expect(result).toBe('Some unknown error occurred')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled Firebase error:', 'auth/unknown-error', 'Some unknown error occurred')
      
      consoleErrorSpy.mockRestore()
    })

    it('should return default message for non-Firebase errors', () => {
      expect(getFirebaseErrorMessage(new Error('Regular error'))).toBe('An unexpected error occurred')
      expect(getFirebaseErrorMessage('string error')).toBe('An unexpected error occurred')
      expect(getFirebaseErrorMessage(null)).toBe('An unexpected error occurred')
      expect(getFirebaseErrorMessage(undefined)).toBe('An unexpected error occurred')
      expect(getFirebaseErrorMessage({})).toBe('An unexpected error occurred')
    })

    it('should handle Firebase error without message', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new FirebaseError('auth/custom-error', '')
      
      const result = getFirebaseErrorMessage(error)
      
      expect(result).toBe('An error occurred')
      
      consoleErrorSpy.mockRestore()
    })
  })
})

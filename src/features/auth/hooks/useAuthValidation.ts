import { useCallback, useMemo } from 'react'

interface ValidationErrors {
  [key: string]: string
}

export function useAuthValidation() {
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) {
      return 'Email is required'
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Email is invalid'
    }
    return undefined
  }, [])

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Password is required'
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    return undefined
  }, [])

  const validateName = useCallback((name: string): string | undefined => {
    if (!name) {
      return 'Name is required'
    }
    if (name.length < 2) {
      return 'Name must be at least 2 characters'
    }
    return undefined
  }, [])

  const validateLoginForm = useCallback((email: string, password: string): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError
    
    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError
    
    return errors
  }, [validateEmail, validatePassword])

  const validateRegisterForm = useCallback((
    email: string, 
    password: string, 
    name: string
  ): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    const nameError = validateName(name)
    if (nameError) errors.name = nameError
    
    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError
    
    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError
    
    return errors
  }, [validateEmail, validatePassword, validateName])

  return useMemo(() => ({
    validateEmail,
    validatePassword,
    validateName,
    validateLoginForm,
    validateRegisterForm
  }), [validateEmail, validatePassword, validateName, validateLoginForm, validateRegisterForm])
}

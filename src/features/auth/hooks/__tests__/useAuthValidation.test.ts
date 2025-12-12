import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuthValidation } from '../useAuthValidation'

describe('useAuthValidation', () => {
  it('should validate email correctly', () => {
    const { result } = renderHook(() => useAuthValidation())

    expect(result.current.validateEmail('')).toBe('Email is required')
    expect(result.current.validateEmail('invalid')).toBe('Email is invalid')
    expect(result.current.validateEmail('test@example.com')).toBeUndefined()
  })

  it('should validate password correctly', () => {
    const { result } = renderHook(() => useAuthValidation())

    expect(result.current.validatePassword('')).toBe('Password is required')
    expect(result.current.validatePassword('12345')).toBe('Password must be at least 6 characters')
    expect(result.current.validatePassword('password123')).toBeUndefined()
  })

  it('should validate name correctly', () => {
    const { result } = renderHook(() => useAuthValidation())

    expect(result.current.validateName('')).toBe('Name is required')
    expect(result.current.validateName('A')).toBe('Name must be at least 2 characters')
    expect(result.current.validateName('John Doe')).toBeUndefined()
  })

  it('should validate login form', () => {
    const { result } = renderHook(() => useAuthValidation())

    const errors = result.current.validateLoginForm('', '')
    expect(errors.email).toBe('Email is required')
    expect(errors.password).toBe('Password is required')

    const validResult = result.current.validateLoginForm('test@example.com', 'password123')
    expect(Object.keys(validResult).length).toBe(0)
  })

  it('should validate register form', () => {
    const { result } = renderHook(() => useAuthValidation())

    const errors = result.current.validateRegisterForm('', '', '')
    expect(errors.email).toBe('Email is required')
    expect(errors.password).toBe('Password is required')
    expect(errors.name).toBe('Name is required')

    const validResult = result.current.validateRegisterForm('test@example.com', 'password123', 'John Doe')
    expect(Object.keys(validResult).length).toBe(0)
  })

  it('should return memoized functions', () => {
    const { result, rerender } = renderHook(() => useAuthValidation())

    const firstValidateEmail = result.current.validateEmail
    rerender()
    const secondValidateEmail = result.current.validateEmail

    expect(firstValidateEmail).toBe(secondValidateEmail)
  })
})

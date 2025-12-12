import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthForm } from '../useAuthForm'

describe('useAuthForm', () => {
  const mockOnSubmit = vi.fn()
  const mockValidate = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockReset()
    mockValidate.mockReset()
  })

  it('should initialize with provided values', () => {
    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: { email: 'test@example.com', password: 'password123' },
        onSubmit: mockOnSubmit,
        validate: mockValidate
      })
    )

    expect(result.current.values).toEqual({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result.current.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should handle input changes', () => {
    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: { email: '', password: '' },
        onSubmit: mockOnSubmit,
        validate: mockValidate
      })
    )

    act(() => {
      const event = {
        target: { name: 'email', value: 'new@example.com' }
      } as React.ChangeEvent<HTMLInputElement>
      result.current.handleChange(event)
    })

    expect(result.current.values.email).toBe('new@example.com')
  })

  it('should clear field error when value changes', () => {
    mockValidate.mockReturnValue({ email: 'Email is required' })

    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: { email: '', password: '' },
        onSubmit: mockOnSubmit,
        validate: mockValidate
      })
    )

    // Trigger validation to set error
    act(() => {
      const submitEvent = { preventDefault: vi.fn() } as any
      result.current.handleSubmit(submitEvent)
    })

    expect(result.current.errors.email).toBe('Email is required')

    // Change field value
    act(() => {
      const changeEvent = {
        target: { name: 'email', value: 'test@example.com' }
      } as React.ChangeEvent<HTMLInputElement>
      result.current.handleChange(changeEvent)
    })

    expect(result.current.errors.email).toBeUndefined()
  })

  it('should validate and submit when form is valid', async () => {
    mockValidate.mockReturnValue({})
    mockOnSubmit.mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: { email: 'test@example.com', password: 'password123' },
        onSubmit: mockOnSubmit,
        validate: mockValidate
      })
    )

    await act(async () => {
      const event = { preventDefault: vi.fn() } as any
      await result.current.handleSubmit(event)
    })

    expect(mockValidate).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should not submit when validation fails', async () => {
    mockValidate.mockReturnValue({ email: 'Email is invalid' })

    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: { email: 'invalid', password: '' },
        onSubmit: mockOnSubmit,
        validate: mockValidate
      })
    )

    await act(async () => {
      const event = { preventDefault: vi.fn() } as any
      await result.current.handleSubmit(event)
    })

    expect(mockValidate).toHaveBeenCalled()
    expect(mockOnSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.email).toBe('Email is invalid')
  })

  it('should set isSubmitting during submission', async () => {
    mockValidate.mockReturnValue({})
    let resolveSubmit: () => void
    const submitPromise = new Promise<void>(resolve => {
      resolveSubmit = resolve
    })
    mockOnSubmit.mockReturnValue(submitPromise)

    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: { email: 'test@example.com', password: 'password123' },
        onSubmit: mockOnSubmit,
        validate: mockValidate
      })
    )

    act(() => {
      const event = { preventDefault: vi.fn() } as any
      result.current.handleSubmit(event)
    })

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true)
    })

    act(() => {
      resolveSubmit!()
    })

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false)
    })
  })

  it('should reset isSubmitting on error', async () => {
    mockValidate.mockReturnValue({})
    mockOnSubmit.mockRejectedValue(new Error('Submit failed'))

    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: { email: 'test@example.com', password: 'password123' },
        onSubmit: mockOnSubmit,
        validate: mockValidate
      })
    )

    await act(async () => {
      const event = { preventDefault: vi.fn() } as any
      try {
        await result.current.handleSubmit(event)
      } catch (err) {
        // Expected to throw
      }
    })

    expect(result.current.isSubmitting).toBe(false)
  })
})

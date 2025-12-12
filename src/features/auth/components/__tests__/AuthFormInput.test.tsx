import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthFormInput } from '../AuthFormInput'

const Icon = () => <svg data-testid="test-icon" />

describe('AuthFormInput', () => {
  const defaultProps = {
    id: 'email',
    name: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'Email',
    value: '',
    onChange: vi.fn(),
    icon: <Icon />
  }

  it('should render input with correct type and name', () => {
    render(<AuthFormInput {...defaultProps} />)

    const input = screen.getByPlaceholderText('Email')
    expect(input).toBeInTheDocument()
    expect(input.getAttribute('type')).toBe('email')
    expect(input.getAttribute('name')).toBe('email')
  })

  it('should render label text', () => {
    render(<AuthFormInput {...defaultProps} />)
    const label = screen.getByText('Email Address')
    expect(label).toBeInTheDocument()
  })

  it('should display error message when error prop is provided', () => {
    render(<AuthFormInput {...defaultProps} error="Email is required" />)

    const error = screen.getByText('Email is required')
    expect(error).toBeInTheDocument()
  })

  it('should call onChange when input value changes', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<AuthFormInput {...defaultProps} onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Email')
    await user.type(input, 'test@example.com')

    expect(handleChange).toHaveBeenCalled()
  })

  it('should render icon when provided', () => {
    render(<AuthFormInput {...defaultProps} />)

    const icon = screen.getByTestId('test-icon')
    expect(icon).toBeInTheDocument()
  })

  it('should render with required attribute when required is true', () => {
    render(<AuthFormInput {...defaultProps} required={true} />)

    const input = screen.getByPlaceholderText('Email')
    expect(input.hasAttribute('required')).toBe(true)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoogleSignInButton } from '../GoogleSignInButton'

describe('GoogleSignInButton', () => {
  it('should render Google sign-in button text', () => {
    render(<GoogleSignInButton onClick={vi.fn()} label="Continue with Google" />)
    const button = screen.getByText('Continue with Google')
    expect(button).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<GoogleSignInButton onClick={handleClick} label="Continue with Google" />)
    const button = screen.getByText('Continue with Google')
    
    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<GoogleSignInButton onClick={vi.fn()} label="Sign in" disabled={true} />)
    const button = screen.getByRole('button')
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('should not be disabled by default', () => {
    render(<GoogleSignInButton onClick={vi.fn()} label="Sign in" />)
    const button = screen.getByRole('button')
    expect(button.hasAttribute('disabled')).toBe(false)
  })

  it('should apply correct styling', () => {
    render(<GoogleSignInButton onClick={vi.fn()} label="Sign in" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('border')
    expect(button.className).toContain('bg-white')
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthBrandHeader } from '../AuthBrandHeader'

describe('AuthBrandHeader', () => {
  it('should render the title and subtitle', () => {
    render(<AuthBrandHeader title="Welcome Back" subtitle="Sign in to access your recipes" />)
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to access your recipes')).toBeInTheDocument()
  })

  it('should render the CookFlow brand text', () => {
    render(<AuthBrandHeader title="Welcome Back" subtitle="Sign in to access your recipes" />)
    expect(screen.getByText('CookFlow')).toBeInTheDocument()
  })

  it('should render the brand tagline', () => {
    render(<AuthBrandHeader title="Welcome Back" subtitle="Sign in to access your recipes" />)
    expect(screen.getByText('Seamlessly Organized. Deliciously Simple.')).toBeInTheDocument()
  })

  it('should render the icon/logo SVG', () => {
    const { container } = render(<AuthBrandHeader title="Welcome Back" subtitle="Sign in to access your recipes" />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.classList.contains('w-10')).toBe(true)
    expect(svg?.classList.contains('h-10')).toBe(true)
  })

  it('should render with correct structure', () => {
    const { container } = render(<AuthBrandHeader title="Welcome Back" subtitle="Sign in to access your recipes" />)
    
    // Check for the gradient background icon container
    const iconContainer = container.querySelector('.bg-gradient-to-br')
    expect(iconContainer).not.toBeNull()
    
    // Check for the amber notification dot
    const notificationDot = container.querySelector('.bg-amber-400')
    expect(notificationDot).not.toBeNull()
  })

  it('should render with different title and subtitle props', () => {
    render(<AuthBrandHeader title="Create Account" subtitle="Join CookFlow today" />)
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByText('Join CookFlow today')).toBeInTheDocument()
    // Brand text should still be present
    expect(screen.getByText('CookFlow')).toBeInTheDocument()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthBrandHeader } from '../AuthBrandHeader'

describe('AuthBrandHeader', () => {
  it('should render the title and subtitle', () => {
    render(<AuthBrandHeader title="Welcome Back" subtitle="Sign in to access your recipes" />)
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to access your recipes')).toBeInTheDocument()
  })
})

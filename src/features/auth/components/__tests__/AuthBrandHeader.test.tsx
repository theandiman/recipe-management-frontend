import { describe, it, expect } from 'vitest'
import { AuthBrandHeader } from '../AuthBrandHeader'

describe('AuthBrandHeader', () => {
  it('should be exported as a component', () => {
    expect(AuthBrandHeader).toBeDefined()
    expect(typeof AuthBrandHeader).toBe('function')
  })

  it('should accept title and subtitle props', () => {
    // Test that component accepts the expected props without errors
    const props = {
      title: 'Welcome Back',
      subtitle: 'Sign in to access your recipes'
    }
    expect(() => AuthBrandHeader(props)).not.toThrow()
  })
})

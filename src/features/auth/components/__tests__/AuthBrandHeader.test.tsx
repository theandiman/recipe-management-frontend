import { describe, it, expect } from 'vitest'
import { AuthBrandHeader } from '../AuthBrandHeader'

describe('AuthBrandHeader', () => {
  it('should be exported as a component', () => {
    expect(AuthBrandHeader).toBeDefined()
    expect(typeof AuthBrandHeader).toBe('function')
  })
})

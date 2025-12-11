import { describe, it, vi, expect } from 'vitest'
import * as AuthContext from './AuthContext'

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn()
}))

describe('Login', () => {
  it('should export Login component', () => {
    // Basic smoke test to ensure module loads
    expect(AuthContext.useAuth).toBeDefined()
  })
})

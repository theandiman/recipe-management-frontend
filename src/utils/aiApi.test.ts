import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveAiApiBase } from './aiApi'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('resolveAiApiBase', () => {
  it('prefers VITE_AI_API_URL over VITE_API_URL', () => {
    vi.stubEnv('VITE_AI_API_URL', 'https://ai.example.com/')
    vi.stubEnv('VITE_API_URL', 'https://legacy.example.com/')
    vi.stubEnv('VITE_MANAGEMENT_API_URL', 'https://management.example.com')

    expect(resolveAiApiBase()).toBe('https://ai.example.com')
  })

  it('falls back to VITE_API_URL when VITE_AI_API_URL is absent', () => {
    vi.stubEnv('VITE_API_URL', 'https://legacy.example.com/')
    vi.stubEnv('VITE_MANAGEMENT_API_URL', 'https://management.example.com')

    expect(resolveAiApiBase()).toBe('https://legacy.example.com')
  })

  it('throws when no AI API URL is configured outside test mode', () => {
    vi.stubEnv('VITE_AI_API_URL', '')
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('VITE_TEST_MODE', 'false')

    expect(() => resolveAiApiBase()).toThrow(/Missing required AI API URL/i)
  })

  it('throws when the AI and management API URLs resolve to the same service', () => {
    vi.stubEnv('VITE_AI_API_URL', 'https://shared.example.com/')
    vi.stubEnv('VITE_MANAGEMENT_API_URL', 'https://shared.example.com')

    expect(() => resolveAiApiBase()).toThrow(/must not match VITE_MANAGEMENT_API_URL/i)
  })
})

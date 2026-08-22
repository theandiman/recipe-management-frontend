import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAIImageGeneration } from '../useAIImageGeneration'

vi.mock('../../../../utils/authApi', () => ({
  postWithAuth: vi.fn(),
}))
vi.mock('../../../../utils/apiUtils', () => ({
  buildApiUrl: (_base: string, endpoint: string) => endpoint,
}))

import { postWithAuth } from '../../../../utils/authApi'

const mockPost = postWithAuth as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('VITE_API_URL', 'https://ai.example.com')
  vi.stubEnv('VITE_MANAGEMENT_API_URL', 'https://management.example.com')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('useAIImageGeneration', () => {
  it('should return status idle initially', () => {
    const { result } = renderHook(() => useAIImageGeneration())
    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
  })

  it('should set status loading while generating', async () => {
    let resolvePost!: (value: unknown) => void
    mockPost.mockReturnValueOnce(new Promise((r) => { resolvePost = r }))

    const { result } = renderHook(() => useAIImageGeneration())

    act(() => {
      result.current.generateImage('Test Recipe')
    })

    expect(result.current.status).toBe('loading')

    await act(async () => {
      resolvePost({ data: { imageUrl: 'https://example.com/image.jpg' } })
    })
  })

  it('should return imageUrl on success and set status success', async () => {
    mockPost.mockResolvedValueOnce({ data: { imageUrl: 'https://example.com/image.jpg' } })

    const { result } = renderHook(() => useAIImageGeneration())

    let url: string | null = null
    await act(async () => {
      url = await result.current.generateImage('Test Recipe', 'A tasty dish')
    })

    expect(url).toBe('https://example.com/image.jpg')
    expect(result.current.status).toBe('success')
    expect(result.current.error).toBeNull()
    expect(mockPost).toHaveBeenCalledWith('/api/recipes/image/generate', { prompt: 'Test Recipe: A tasty dish' })
  })

  it('should set status error and error message on failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useAIImageGeneration())

    let url: string | null = null
    await act(async () => {
      url = await result.current.generateImage('Test Recipe')
    })

    expect(url).toBeNull()
    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Network error')
  })

  it('should set status error when response contains no usable imageUrl', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })

    const { result } = renderHook(() => useAIImageGeneration())

    let url: string | null = null
    await act(async () => {
      url = await result.current.generateImage('Test Recipe')
    })

    expect(url).toBeNull()
    expect(result.current.status).toBe('error')
    expect(result.current.error).toMatch(/usable image URL/i)
  })

  it('should reset error on new generation attempt', async () => {
    mockPost.mockRejectedValueOnce(new Error('First error'))
    mockPost.mockResolvedValueOnce({ data: { imageUrl: 'https://example.com/image2.jpg' } })

    const { result } = renderHook(() => useAIImageGeneration())

    await act(async () => {
      await result.current.generateImage('Test Recipe')
    })
    expect(result.current.error).toBe('First error')

    await act(async () => {
      await result.current.generateImage('Test Recipe')
    })
    expect(result.current.error).toBeNull()
    expect(result.current.status).toBe('success')
  })

  it('should surface a configuration error when AI and management URLs match', async () => {
    vi.stubEnv('VITE_AI_API_URL', 'https://same.example.com')
    vi.stubEnv('VITE_MANAGEMENT_API_URL', 'https://same.example.com/')

    const { result } = renderHook(() => useAIImageGeneration())

    let url: string | null = null
    await act(async () => {
      url = await result.current.generateImage('Test Recipe')
    })

    expect(url).toBeNull()
    expect(result.current.status).toBe('error')
    expect(result.current.error).toMatch(/must not match VITE_MANAGEMENT_API_URL/i)
    expect(mockPost).not.toHaveBeenCalled()
  })
})

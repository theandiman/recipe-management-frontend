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

describe('parseAiSearchIntent', () => {
  it('returns default fallback for empty prompt', async () => {
    const { parseAiSearchIntent } = await import('./aiApi')
    const result = await parseAiSearchIntent('')
    expect(result.queryKeywords).toBe('')
    expect(result.dietaryTags).toEqual([])
  })

  it('parses valid AI search intent API response correctly', async () => {
    const { parseAiSearchIntent } = await import('./aiApi')
    vi.stubEnv('VITE_AI_API_URL', 'https://ai.example.com')
    vi.stubEnv('VITE_MANAGEMENT_API_URL', 'https://api.example.com')

    const mockResponse = {
      queryKeywords: 'pasta',
      dietaryTags: ['Quick & Easy', 'Low Carb'],
      maxPrepTime: 30,
      maxCalories: 500,
      explanation: 'Filtered quick pasta under 500 kcal',
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await parseAiSearchIntent('Quick low-carb pasta under 500 kcal')

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://ai.example.com/api/recipes/search/parse-intent',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ prompt: 'Quick low-carb pasta under 500 kcal' }),
      }),
    )

    expect(result.queryKeywords).toBe('pasta')
    expect(result.dietaryTags).toEqual(['Quick & Easy', 'Low Carb'])
    expect(result.maxPrepTime).toBe(30)
    expect(result.maxCalories).toBe(500)
    expect(result.explanation).toBe('Filtered quick pasta under 500 kcal')

    fetchSpy.mockRestore()
  })

  it('falls back gracefully to raw prompt if fetch fails', async () => {
    const { parseAiSearchIntent } = await import('./aiApi')
    vi.stubEnv('VITE_AI_API_URL', 'https://ai.example.com')

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const result = await parseAiSearchIntent('Vegetarian curry')

    expect(result.queryKeywords).toBe('Vegetarian curry')
    expect(result.dietaryTags).toEqual([])
    expect(result.explanation).toContain('Using standard keyword search')

    fetchSpy.mockRestore()
  })
})

describe('queryAiSearch', () => {
  it('returns empty matches for empty prompt', async () => {
    const { queryAiSearch } = await import('./aiApi')
    const result = await queryAiSearch('', [])
    expect(result.matches).toEqual([])
    expect(result.suggestedIdea).toBeNull()
  })

  it('queries /api/recipes/search/query and parses direct match response', async () => {
    const { queryAiSearch } = await import('./aiApi')
    vi.stubEnv('VITE_AI_API_URL', 'https://ai.example.com')
    vi.stubEnv('VITE_MANAGEMENT_API_URL', 'https://api.example.com')

    const mockResponse = {
      matches: [{ recipeId: 'r-1', matchScore: 0.9, matchReason: 'Comforting pasta dish' }],
      suggestedIdea: { title: 'Tomato Soup', prompt: 'Create tomato soup', reason: 'Warm soup idea' },
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await queryAiSearch('cozy winter pasta', [
      { id: 'r-1', recipeName: 'Rigatoni Bake' }
    ])

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://ai.example.com/api/recipes/search/query',
      expect.objectContaining({
        method: 'POST',
      }),
    )

    expect(result.matches.length).toBe(1)
    expect(result.matches[0].recipeId).toBe('r-1')
    expect(result.matches[0].matchReason).toBe('Comforting pasta dish')
    expect(result.suggestedIdea?.title).toBe('Tomato Soup')

    fetchSpy.mockRestore()
  })
})

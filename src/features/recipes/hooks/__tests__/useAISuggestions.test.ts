import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAISuggestions } from '../useAISuggestions'

// Mock the auth and api utilities so we can control the HTTP response
vi.mock('../../../../utils/authApi', () => ({
  postWithAuth: vi.fn(),
}))
vi.mock('../../../../utils/apiUtils', () => ({
  buildApiUrl: vi.fn((_base: string, endpoint: string) => endpoint),
}))

import { buildApiUrl } from '../../../../utils/apiUtils'
const mockBuildApiUrl = vi.mocked(buildApiUrl)

import { postWithAuth } from '../../../../utils/authApi'

const mockPostWithAuth = vi.mocked(postWithAuth)

describe('useAISuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console output in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in idle state with no suggestions', () => {
    const { result } = renderHook(() => useAISuggestions())
    expect(result.current.status).toBe('idle')
    expect(result.current.suggestions).toEqual([])
    expect(result.current.visibleSuggestions).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('transitions to loading then success after fetchSuggestions', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'description', suggestedValue: 'A tasty dish', reason: 'No description' },
        ],
      },
    } as any)

    const { result } = renderHook(() => useAISuggestions())

    act(() => {
      result.current.fetchSuggestions({ recipeName: 'Pasta' })
    })

    expect(result.current.status).toBe('loading')

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    expect(result.current.suggestions).toHaveLength(1)
    expect(result.current.suggestions[0].field).toBe('description')
    expect(result.current.suggestions[0].source).toBe('bulk')
    expect(result.current.visibleSuggestions).toHaveLength(1)
  })

  it('transitions to error when the fetch fails', async () => {
    mockPostWithAuth.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useAISuggestions())

    await act(async () => {
      await result.current.fetchSuggestions({ recipeName: 'Pasta' })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Network error')
    expect(result.current.suggestions).toEqual([])
  })

  it('applySuggestion calls the setter and hides the suggestion', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'description', suggestedValue: 'A tasty dish', reason: 'No description' },
          { field: 'prepTime', suggestedValue: '15', reason: 'No prep time' },
        ],
      },
    } as any)

    const { result } = renderHook(() => useAISuggestions())

    await act(async () => {
      await result.current.fetchSuggestions({ recipeName: 'Pasta' })
    })

    expect(result.current.visibleSuggestions).toHaveLength(2)

    const setter = vi.fn()
    act(() => {
      result.current.applySuggestion('description', setter, '')
    })

    expect(setter).toHaveBeenCalledWith('A tasty dish')
    expect(result.current.visibleSuggestions).toHaveLength(1)
    expect(result.current.visibleSuggestions[0].field).toBe('prepTime')
  })

  it('dismissSuggestion hides the suggestion without calling a setter', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'description', suggestedValue: 'A tasty dish', reason: 'No description' },
          { field: 'prepTime', suggestedValue: '15', reason: 'No prep time' },
        ],
      },
    } as any)

    const { result } = renderHook(() => useAISuggestions())

    await act(async () => {
      await result.current.fetchSuggestions({ recipeName: 'Pasta' })
    })

    act(() => {
      result.current.dismissSuggestion('description')
    })

    expect(result.current.visibleSuggestions).toHaveLength(1)
    expect(result.current.visibleSuggestions[0].field).toBe('prepTime')
    expect(result.current.dismissedFields.has('description')).toBe(true)
  })

  it('dismissing one suggestion does not affect other suggestions', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'prepTime', suggestedValue: '10', reason: '' },
          { field: 'cookTime', suggestedValue: '20', reason: '' },
          { field: 'servings', suggestedValue: '4', reason: '' },
        ],
      },
    } as any)

    const { result } = renderHook(() => useAISuggestions())

    await act(async () => {
      await result.current.fetchSuggestions({ recipeName: 'Pasta' })
    })

    act(() => {
      result.current.dismissSuggestion('prepTime')
    })

    const visible = result.current.visibleSuggestions
    expect(visible).toHaveLength(2)
    expect(visible.map(s => s.field)).toEqual(['cookTime', 'servings'])
  })

  it('dispatchesCustomEvents on apply and dismiss', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'description', suggestedValue: 'Delicious', reason: '' },
        ],
      },
    } as any)

    const events: string[] = []
    const listener = (e: Event) => events.push((e as CustomEvent).detail.type)
    window.addEventListener('ai:suggestions', listener)

    const { result } = renderHook(() => useAISuggestions())

    await act(async () => {
      await result.current.fetchSuggestions({ recipeName: 'Test' })
    })

        // Apply suggestion
    const setter = vi.fn()
    act(() => {
      result.current.applySuggestion('description', setter, '')
    })
    expect(events).toContain('ai_suggestion_applied')

    // Dismiss suggestion (should be no-op since it's already applied, but event should still fire)
    act(() => {
      result.current.dismissSuggestion('description')
    })
    expect(events).toContain('ai_suggestion_dismissed')

    expect(events).toContain('ai_suggestions_fetched')

    window.removeEventListener('ai:suggestions', listener)
  })

  describe('fetchFieldSuggestion', () => {
    it('should set fieldStatus[field] to loading while fetching', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolvePost!: (value: any) => void
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pending!: Promise<any>
      mockPostWithAuth.mockReturnValueOnce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Promise<any>((resolve) => { resolvePost = resolve })
      )

      const { result } = renderHook(() => useAISuggestions())

      act(() => {
        pending = result.current.fetchFieldSuggestion('description', '')
      })

      expect(result.current.fieldStatus.get('description')).toBe('loading')

      await act(async () => {
        resolvePost({ data: { suggestions: [{ field: 'description', suggestedValue: 'x', reason: '' }] } })
        await pending
      })
    })

    it('should add single-field suggestion to suggestions on success', async () => {
      mockPostWithAuth.mockResolvedValueOnce({
        data: {
          suggestions: [{ field: 'description', suggestedValue: 'A delicious meal', reason: 'No description' }],
        },
      } as any)

      const { result } = renderHook(() => useAISuggestions())

      await act(async () => {
        await result.current.fetchFieldSuggestion('description', '')
      })

      expect(result.current.suggestions).toHaveLength(1)
      expect(result.current.suggestions[0].field).toBe('description')
      expect(result.current.suggestions[0].suggestedValue).toBe('A delicious meal')
      expect(result.current.suggestions[0].source).toBe('field')
    })

    it('should set fieldStatus[field] to success after fetch', async () => {
      mockPostWithAuth.mockResolvedValueOnce({
        data: {
          suggestions: [{ field: 'prepTime', suggestedValue: '15 minutes', reason: '' }],
        },
      } as any)

      const { result } = renderHook(() => useAISuggestions())

      await act(async () => {
        await result.current.fetchFieldSuggestion('prepTime', '')
      })

      expect(result.current.fieldStatus.get('prepTime')).toBe('success')
    })

    it('should set fieldStatus[field] to error if fetch fails', async () => {
      mockPostWithAuth.mockRejectedValueOnce(new Error('API error'))

      const { result } = renderHook(() => useAISuggestions())

      await act(async () => {
        await result.current.fetchFieldSuggestion('cookTime', '')
      })

      expect(result.current.fieldStatus.get('cookTime')).toBe('error')
    })

    it('should not affect fieldStatus or bulk suggestions for other fields', async () => {
      // Pre-populate suggestions for another field via fetchSuggestions
      mockPostWithAuth.mockResolvedValueOnce({
        data: {
          suggestions: [{ field: 'prepTime', suggestedValue: '10 min', reason: '' }],
        },
      } as any)

      const { result } = renderHook(() => useAISuggestions())

      await act(async () => {
        await result.current.fetchSuggestions({ recipeName: 'Pasta' })
      })

      // Now fetch for a different field
      mockPostWithAuth.mockResolvedValueOnce({
        data: {
          suggestions: [{ field: 'description', suggestedValue: 'Tasty', reason: '' }],
        },
      } as any)

      await act(async () => {
        await result.current.fetchFieldSuggestion('description', '')
      })

      // prepTime bulk suggestion should still be present
      const prepTimeSuggestion = result.current.suggestions.find(s => s.field === 'prepTime')
      expect(prepTimeSuggestion).toBeDefined()
      expect(prepTimeSuggestion?.suggestedValue).toBe('10 min')
      expect(prepTimeSuggestion?.source).toBe('bulk')

      const descriptionSuggestion = result.current.suggestions.find(
        s => s.field === 'description' && s.source === 'field'
      )
      expect(descriptionSuggestion).toBeDefined()
      expect(descriptionSuggestion?.suggestedValue).toBe('Tasty')

      // fieldStatus for description should be success, prepTime unaffected
      expect(result.current.fieldStatus.get('description')).toBe('success')
      expect(result.current.fieldStatus.get('prepTime')).toBeUndefined()
    })

    it('should pass currentValue in the targeted request to the API', async () => {
      mockPostWithAuth.mockResolvedValueOnce({
        data: { suggestions: [] },
      } as any)

      const { result } = renderHook(() => useAISuggestions())

      await act(async () => {
        await result.current.fetchFieldSuggestion('description', 'partial desc', { recipeName: 'Test Recipe' })
      })

      expect(mockPostWithAuth).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ description: 'partial desc', recipeName: 'Test Recipe' })
      )
    })

    it('should not reset existing suggestions for other fields', async () => {
      mockPostWithAuth.mockResolvedValueOnce({
        data: {
          suggestions: [
            { field: 'prepTime', suggestedValue: '10 min', reason: '' },
            { field: 'cookTime', suggestedValue: '20 min', reason: '' },
          ],
        },
      } as any)

      const { result } = renderHook(() => useAISuggestions())

      await act(async () => {
        await result.current.fetchSuggestions({ recipeName: 'Pasta' })
      })

      expect(result.current.suggestions).toHaveLength(2)

      // Fetch only for description
      mockPostWithAuth.mockResolvedValueOnce({
        data: {
          suggestions: [{ field: 'description', suggestedValue: 'A tasty dish', reason: '' }],
        },
      } as any)

      await act(async () => {
        await result.current.fetchFieldSuggestion('description', '')
      })

      // All three fields should be present
      expect(result.current.suggestions).toHaveLength(3)
      expect(result.current.suggestions.map(s => s.field)).toContain('prepTime')
      expect(result.current.suggestions.map(s => s.field)).toContain('cookTime')
      expect(result.current.suggestions.map(s => s.field)).toContain('description')
    })

    it('keeps bulk and field suggestions for the same field side by side', async () => {
      mockPostWithAuth.mockResolvedValueOnce({
        data: {
          suggestions: [{ field: 'description', suggestedValue: 'Bulk description', reason: '' }],
        },
      } as any)

      const { result } = renderHook(() => useAISuggestions())

      await act(async () => {
        await result.current.fetchSuggestions({ recipeName: 'Pasta' })
      })

      mockPostWithAuth.mockResolvedValueOnce({
        data: {
          suggestions: [{ field: 'description', suggestedValue: 'Field description', reason: '' }],
        },
      } as any)

      await act(async () => {
        await result.current.fetchFieldSuggestion('description', '')
      })

      const descriptionSuggestions = result.current.suggestions.filter(s => s.field === 'description')
      expect(descriptionSuggestions).toHaveLength(2)
      expect(descriptionSuggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ suggestedValue: 'Bulk description', source: 'bulk' }),
          expect.objectContaining({ suggestedValue: 'Field description', source: 'field' }),
        ])
      )
    })
  })

  describe('API base URL resolution', () => {
    it('uses VITE_AI_API_URL when set, preferring it over VITE_API_URL', async () => {
      vi.stubEnv('VITE_AI_API_URL', 'https://ai.example.com')

      mockPostWithAuth.mockResolvedValueOnce({ data: { suggestions: [] } } as any)

      const { result } = renderHook(() => useAISuggestions())
      await act(async () => {
        await result.current.fetchSuggestions({ recipeName: 'Test' })
      })

      expect(mockBuildApiUrl).toHaveBeenCalledWith('https://ai.example.com', '/api/recipes/suggest-fields')
      vi.unstubAllEnvs()
    })

    it('falls back to VITE_API_URL when VITE_AI_API_URL is absent', async () => {
      // VITE_AI_API_URL is not set in the test environment, so the hook falls back to VITE_API_URL
      mockPostWithAuth.mockResolvedValueOnce({ data: { suggestions: [] } } as any)

      const { result } = renderHook(() => useAISuggestions())
      await act(async () => {
        await result.current.fetchSuggestions({ recipeName: 'Test' })
      })

      const expectedBase = import.meta.env.VITE_API_URL || ''
      expect(mockBuildApiUrl).toHaveBeenCalledWith(expectedBase, '/api/recipes/suggest-fields')
    })
  })
})

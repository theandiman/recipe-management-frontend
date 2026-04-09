import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAISuggestions } from '../useAISuggestions'

// Mock the auth and api utilities so we can control the HTTP response
vi.mock('../../../../utils/authApi', () => ({
  postWithAuth: vi.fn(),
}))
vi.mock('../../../../utils/apiUtils', () => ({
  buildApiUrl: (_base: string, endpoint: string) => endpoint,
}))

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
      result.current.applySuggestion('description', setter)
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
      result.current.applySuggestion('description', setter)
    })

    // Dismiss suggestion (should be no-op since it's already applied, but event should still fire)
    act(() => {
      result.current.dismissSuggestion('description')
    })

    expect(events).toContain('ai_suggestions_fetched')
    expect(events).toContain('ai_suggestion_applied')
    expect(events).toContain('ai_suggestion_dismissed')

    window.removeEventListener('ai:suggestions', listener)
  })
})

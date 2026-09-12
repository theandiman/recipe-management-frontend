import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { useRecipeSearchFilters } from './useRecipeSearchFilters'
import { parseAiSearchIntent } from '../../../utils/aiApi'
import type { Recipe } from '../../../types/nutrition'

vi.mock('../../../utils/aiApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/aiApi')>()
  return {
    ...actual,
    parseAiSearchIntent: vi.fn(),
  }
})

const sampleRecipes: Recipe[] = [
  {
    id: '1',
    recipeName: 'Keto Avocado Salad',
    description: 'Quick keto salad',
    tags: ['Keto', 'Salad', 'Gluten-Free'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 1,
    instructions: ['Mix ingredients'],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 350 } },
    ingredients: ['1 whole Avocado', '2 cups Spinach'],
  },
  {
    id: '2',
    recipeName: 'Vegan Lentil Soup',
    description: 'Hearty vegan soup',
    tags: ['Vegan', 'Soup', 'Gluten-Free'],
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    servings: 4,
    instructions: ['Boil lentils'],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 550 } },
    ingredients: ['1 cup Lentils', '2 cloves Garlic'],
  },
]

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter initialEntries={['/dashboard/recipes']}>
    {children}
  </MemoryRouter>
)

describe('useRecipeSearchFilters', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('filters recipes instantly via plain-text matching across title, tags, ingredients without AI API calls', () => {
    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    expect(result.current.filteredAndSortedRecipes).toHaveLength(2)
    expect(result.current.filters.dietaryTags).toEqual([])

    act(() => {
      result.current.setSearchText('spinach')
    })

    expect(result.current.filteredAndSortedRecipes).toHaveLength(1)
    expect(result.current.filteredAndSortedRecipes[0].recipeName).toBe('Keto Avocado Salad')
    // Crucial: plain-text search MUST NOT invoke parseAiSearchIntent
    expect(vi.mocked(parseAiSearchIntent)).not.toHaveBeenCalled()
  })

  it('invokes parseAiSearchIntent on submitAiPrompt and updates nlpSummary', async () => {
    vi.mocked(parseAiSearchIntent).mockResolvedValue({
      queryKeywords: 'salad',
      dietaryTags: ['Keto'],
      maxCalories: 400,
      maxPrepTime: 15,
      explanation: 'Filtered keto salad under 400 kcal',
    })

    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    await act(async () => {
      await result.current.submitAiPrompt('Quick keto salad under 400 kcal')
    })

    expect(vi.mocked(parseAiSearchIntent)).toHaveBeenCalledWith('Quick keto salad under 400 kcal')
    expect(result.current.nlpSummary).toBe('Filtered keto salad under 400 kcal')
    expect(result.current.aiPrompt).toBe('Quick keto salad under 400 kcal')
    // Filter drawer state should remain untouched
    expect(result.current.filters.dietaryTags).toEqual([])
    expect(result.current.filters.maxCalories).toBeNull()
  })

  it('resets search, aiPrompt and nlpSummary on clearAllFilters', async () => {
    vi.mocked(parseAiSearchIntent).mockResolvedValue({
      queryKeywords: 'salad',
      dietaryTags: ['Keto'],
      explanation: 'Filtered salad',
    })

    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    act(() => {
      result.current.setSearchText('salad')
    })
    await act(async () => {
      await result.current.submitAiPrompt('healthy salad')
    })

    expect(result.current.nlpSummary).toBe('Filtered salad')

    act(() => {
      result.current.clearAllFilters()
    })

    expect(result.current.searchText).toBe('')
    expect(result.current.aiPrompt).toBe('')
    expect(result.current.nlpSummary).toBeNull()
    expect(result.current.filteredAndSortedRecipes).toHaveLength(2)
  })

  it('clears only AI prompt when clearAiPrompt is called', async () => {
    vi.mocked(parseAiSearchIntent).mockResolvedValue({
      queryKeywords: 'soup',
      dietaryTags: [],
      explanation: 'Filtered soup',
    })

    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    act(() => {
      result.current.setSearchText('soup')
    })
    await act(async () => {
      await result.current.submitAiPrompt('vegan soup')
    })

    expect(result.current.nlpSummary).toBe('Filtered soup')

    act(() => {
      result.current.clearAiPrompt()
    })

    expect(result.current.aiPrompt).toBe('')
    expect(result.current.nlpSummary).toBeNull()
    // searchText remains intact
    expect(result.current.searchText).toBe('soup')
    expect(result.current.filteredAndSortedRecipes).toHaveLength(1)
    expect(result.current.filteredAndSortedRecipes[0].recipeName).toBe('Vegan Lentil Soup')
  })

  it('handles AI intent parser failure gracefully without disrupting search results', async () => {
    vi.mocked(parseAiSearchIntent).mockRejectedValueOnce(new Error('AI Service Offline'))

    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    await act(async () => {
      await result.current.submitAiPrompt('soup')
    })

    expect(result.current.isAiLoading).toBe(false)
    expect(result.current.nlpSummary).toBeNull()
  })

  it('prevents race conditions when subsequent AI prompts or clear are called before previous finishes', async () => {
    let resolveFirst: (val: any) => void
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve
    })

    vi.mocked(parseAiSearchIntent)
      .mockImplementationOnce(() => firstPromise as any)
      .mockResolvedValueOnce({
        queryKeywords: 'salad',
        dietaryTags: ['Keto'],
        explanation: 'Second intent',
      })

    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    // Trigger first (slow) prompt
    let p1: Promise<void>
    act(() => {
      p1 = result.current.submitAiPrompt('slow query')
    })

    // Trigger second prompt before first resolves
    await act(async () => {
      await result.current.submitAiPrompt('salad')
    })

    expect(result.current.nlpSummary).toBe('Second intent')

    // Now let first promise resolve
    await act(async () => {
      resolveFirst!({
        queryKeywords: 'slow',
        dietaryTags: [],
        explanation: 'First intent stale',
      })
      await p1!
    })

    // Should remain 'Second intent' and not be overwritten by stale first intent
    expect(result.current.nlpSummary).toBe('Second intent')
  })
})

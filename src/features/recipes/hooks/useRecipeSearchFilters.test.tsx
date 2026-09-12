import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { useRecipeSearchFilters } from './useRecipeSearchFilters'
import * as aiApi from '../../../utils/aiApi'
import type { Recipe } from '../../../types/nutrition'

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
    vi.restoreAllMocks()
  })

  it('filters recipes instantly via in-memory NLP without mutating manual filters', () => {
    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    expect(result.current.filteredAndSortedRecipes).toHaveLength(2)
    expect(result.current.filters.dietaryTags).toEqual([])

    act(() => {
      result.current.setSearchText('quick low carb salad')
    })

    expect(result.current.filteredAndSortedRecipes).toHaveLength(1)
    expect(result.current.filteredAndSortedRecipes[0].recipeName).toBe('Keto Avocado Salad')
    // Crucial: typing in search MUST NOT mutate the manual filter drawer dietaryTags
    expect(result.current.filters.dietaryTags).toEqual([])
  })

  it('debounces parseAiSearchIntent and updates nlpSummary', async () => {
    const parseSpy = vi.spyOn(aiApi, 'parseAiSearchIntent').mockResolvedValueOnce({
      queryKeywords: 'salad',
      dietaryTags: ['Keto'],
      maxCalories: 400,
      maxPrepTime: 15,
      explanation: 'Filtered keto salad under 400 kcal',
    })

    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    act(() => {
      result.current.setSearchText('Quick keto salad under 400 kcal')
    })

    await waitFor(() => {
      expect(parseSpy).toHaveBeenCalledWith('Quick keto salad under 400 kcal')
    })

    await waitFor(() => {
      expect(result.current.nlpSummary).toBe('Filtered keto salad under 400 kcal')
    })

    // Filter drawer state should remain untouched
    expect(result.current.filters.dietaryTags).toEqual([])
    expect(result.current.filters.maxCalories).toBeNull()
  })

  it('resets search and nlpSummary on clearAllFilters', async () => {
    vi.spyOn(aiApi, 'parseAiSearchIntent').mockResolvedValueOnce({
      queryKeywords: 'salad',
      dietaryTags: ['Keto'],
      explanation: 'Filtered salad',
    })

    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    act(() => {
      result.current.setSearchText('salad')
    })

    await waitFor(() => {
      expect(result.current.nlpSummary).toBe('Filtered salad')
    })

    act(() => {
      result.current.clearAllFilters()
    })

    expect(result.current.searchText).toBe('')
    expect(result.current.nlpSummary).toBeNull()
    expect(result.current.filteredAndSortedRecipes).toHaveLength(2)
  })

  it('handles AI intent parser failure gracefully without disrupting search results', async () => {
    vi.spyOn(aiApi, 'parseAiSearchIntent').mockRejectedValueOnce(new Error('AI Service Offline'))

    const { result } = renderHook(() => useRecipeSearchFilters(sampleRecipes), { wrapper })

    act(() => {
      result.current.setSearchText('soup')
    })

    await waitFor(() => {
      expect(result.current.filteredAndSortedRecipes).toHaveLength(1)
      expect(result.current.filteredAndSortedRecipes[0].recipeName).toBe('Vegan Lentil Soup')
    })

    expect(result.current.nlpSummary).toBeNull()
  })
})

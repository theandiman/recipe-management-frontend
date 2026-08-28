import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  type RecipeFilterState,
  DEFAULT_RECIPE_FILTERS,
  filterRecipes,
} from '../utils/recipeFiltering'
import {
  type SortOption,
  type ViewMode,
  sortRecipes,
} from '../utils/recipeSorting'
import type { Recipe } from '../../../types/nutrition'

export interface UseRecipeSearchFiltersReturn {
  searchText: string
  setSearchText: (text: string) => void
  filters: RecipeFilterState
  setFilters: React.Dispatch<React.SetStateAction<RecipeFilterState>>
  sortOption: SortOption
  setSortOption: (sort: SortOption) => void
  viewMode: ViewMode
  setViewMode: (view: ViewMode) => void
  isFilterDrawerOpen: boolean
  setIsFilterDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  filteredAndSortedRecipes: Recipe[]
  clearAllFilters: () => void
  removeDietaryTag: (tag: string) => void
}

export const useRecipeSearchFilters = (allRecipes: Recipe[]): UseRecipeSearchFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse initial query state from URL
  const initialQuery = searchParams.get('q') || ''
  const initialTag = searchParams.get('tag')
  const initialDiet = searchParams.get('diet') ? searchParams.get('diet')!.split(',') : (initialTag ? [initialTag] : [])
  const initialMaxTime = searchParams.get('maxTime') ? Number(searchParams.get('maxTime')) : null
  const initialMaxCal = searchParams.get('maxCal') ? Number(searchParams.get('maxCal')) : null
  const initialSort = (searchParams.get('sort') as SortOption) || 'relevance'
  const initialView = (searchParams.get('view') as ViewMode) || (localStorage.getItem('recipe_view_mode_v1') as ViewMode) || 'grid'

  const [searchText, setSearchText] = useState(initialQuery)
  const [filters, setFilters] = useState<RecipeFilterState>({
    dietaryTags: initialDiet,
    maxPrepTime: initialMaxTime,
    maxCalories: initialMaxCal,
    includeIngredients: [],
    excludeIngredients: [],
  })
  const [sortOption, setSortOption] = useState<SortOption>(initialSort)
  const [viewMode, setViewModeState] = useState<ViewMode>(initialView)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem('recipe_view_mode_v1', mode)
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchText.trim()) params.set('q', searchText.trim())
    if (filters.dietaryTags.length > 0) params.set('diet', filters.dietaryTags.join(','))
    if (filters.maxPrepTime !== null) params.set('maxTime', String(filters.maxPrepTime))
    if (filters.maxCalories !== null) params.set('maxCal', String(filters.maxCalories))
    if (sortOption !== 'relevance') params.set('sort', sortOption)
    if (viewMode !== 'grid') params.set('view', viewMode)

    setSearchParams(params, { replace: true })
  }, [searchText, filters, sortOption, viewMode, setSearchParams])

  // Filter & Sort Pipeline
  const filteredAndSortedRecipes = useMemo(() => {
    const filtered = filterRecipes(allRecipes, filters, searchText)
    return sortRecipes(filtered, sortOption)
  }, [allRecipes, filters, searchText, sortOption])

  const clearAllFilters = useCallback(() => {
    setSearchText('')
    setFilters(DEFAULT_RECIPE_FILTERS)
    setSortOption('relevance')
  }, [])

  const removeDietaryTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.filter(t => t !== tag),
    }))
  }, [])

  return {
    searchText,
    setSearchText,
    filters,
    setFilters,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    filteredAndSortedRecipes,
    clearAllFilters,
    removeDietaryTag,
  }
}

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
import { parseAiSearchIntent } from '../../../utils/aiApi'
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
  nlpSummary: string | null
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

  // Listen for incoming URL parameter changes (e.g. from Dashboard navigation)
  useEffect(() => {
    const urlQ = searchParams.get('q') || ''
    const urlTag = searchParams.get('tag')
    const urlDiet = searchParams.get('diet') ? searchParams.get('diet')!.split(',') : (urlTag ? [urlTag] : [])

    if (urlQ && urlQ !== searchText) {
      setSearchText(urlQ)
    }

    if (urlDiet.length > 0) {
      setFilters(prev => {
        const hasAll = urlDiet.every(t => prev.dietaryTags.includes(t))
        if (!hasAll) {
          const merged = Array.from(new Set([...prev.dietaryTags, ...urlDiet]))
          return { ...prev, dietaryTags: merged }
        }
        return prev
      })
    }
  }, [searchParams])

  // Sync internal state out to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (searchText.trim()) params.set('q', searchText.trim())
    else params.delete('q')

    if (filters.dietaryTags.length > 0) params.set('diet', filters.dietaryTags.join(','))
    else params.delete('diet')

    if (filters.maxPrepTime !== null) params.set('maxTime', String(filters.maxPrepTime))
    else params.delete('maxTime')

    if (filters.maxCalories !== null) params.set('maxCal', String(filters.maxCalories))
    else params.delete('maxCal')

    if (sortOption !== 'relevance') params.set('sort', sortOption)
    else params.delete('sort')

    if (viewMode !== 'grid') params.set('view', viewMode)
    else params.delete('view')

    const newQueryString = params.toString()
    const currentQueryString = searchParams.toString()

    if (newQueryString !== currentQueryString) {
      setSearchParams(params, { replace: true })
    }
  }, [searchText, filters, sortOption, viewMode])

  // Filter & Sort Pipeline
  const filteredAndSortedRecipes = useMemo(() => {
    const filtered = filterRecipes(allRecipes, filters, searchText)
    return sortRecipes(filtered, sortOption)
  }, [allRecipes, filters, searchText, sortOption])

  const [nlpSummary, setNlpSummary] = useState<string | null>(null)

  // Debounced NLP intent parser for numeric caps and dietary intent in search box
  useEffect(() => {
    if (!searchText.trim() || searchText.trim().length < 4) {
      setNlpSummary(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const intent = await parseAiSearchIntent(searchText)
        const summaryParts: string[] = []

        if (typeof intent.maxPrepTime === 'number') {
          const prepVal = intent.maxPrepTime
          summaryParts.push(`Max Prep: ${prepVal} mins`)
          setFilters(prev => (prev.maxPrepTime !== prepVal ? { ...prev, maxPrepTime: prepVal } : prev))
        }

        if (typeof intent.maxCalories === 'number') {
          const calVal = intent.maxCalories
          summaryParts.push(`Max Cals: ${calVal} kcal`)
          setFilters(prev => (prev.maxCalories !== calVal ? { ...prev, maxCalories: calVal } : prev))
        }

        if (intent.dietaryTags && intent.dietaryTags.length > 0) {
          summaryParts.push(`Tags: ${intent.dietaryTags.join(', ')}`)
          setFilters(prev => {
            const merged = Array.from(new Set([...prev.dietaryTags, ...intent.dietaryTags]))
            return merged.length !== prev.dietaryTags.length ? { ...prev, dietaryTags: merged } : prev
          })
        }

        if (summaryParts.length > 0) {
          setNlpSummary(summaryParts.join(' • '))
        } else {
          setNlpSummary(null)
        }
      } catch {
        setNlpSummary(null)
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [searchText])

  const clearAllFilters = useCallback(() => {
    setSearchText('')
    setNlpSummary(null)
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
    nlpSummary,
  }
}

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  type RecipeFilterState,
  type AiMatchScore,
  DEFAULT_RECIPE_FILTERS,
  filterRecipes,
} from '../utils/recipeFiltering'
import {
  type SortOption,
  type ViewMode,
  sortRecipes,
} from '../utils/recipeSorting'
import {
  queryAiSearch,
  type RecipeSummaryForAi,
  type AiSearchQueryResult,
} from '../../../utils/aiApi'
import type { Recipe } from '../../../types/nutrition'

export interface UseRecipeSearchFiltersReturn {
  searchText: string
  setSearchText: (text: string) => void
  aiPrompt: string
  setAiPrompt: (prompt: string) => void
  submitAiPrompt: (prompt: string) => Promise<void>
  clearAiPrompt: () => void
  isAiPromptOpen: boolean
  setIsAiPromptOpen: React.Dispatch<React.SetStateAction<boolean>>
  isAiLoading: boolean
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
  aiMatchesMap: Record<string, AiMatchScore> | null
  suggestedIdea: AiSearchQueryResult['suggestedIdea'] | null
}

export const useRecipeSearchFilters = (allRecipes: Recipe[]): UseRecipeSearchFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse initial query state from URL
  const initialQuery = searchParams.get('q') || ''
  const initialAiPrompt = searchParams.get('ai_prompt') || ''
  const initialTag = searchParams.get('tag')
  const initialDiet = searchParams.get('diet') ? searchParams.get('diet')!.split(',') : (initialTag ? [initialTag] : [])
  const initialMaxTime = searchParams.get('maxTime') ? Number(searchParams.get('maxTime')) : null
  const initialMaxCal = searchParams.get('maxCal') ? Number(searchParams.get('maxCal')) : null
  const initialSort = (searchParams.get('sort') as SortOption) || 'relevance'
  const initialView = (searchParams.get('view') as ViewMode) || (localStorage.getItem('recipe_view_mode_v1') as ViewMode) || 'grid'

  const [searchText, setSearchText] = useState(initialQuery)
  const [aiPrompt, setAiPrompt] = useState(initialAiPrompt)
  const [isAiPromptOpen, setIsAiPromptOpen] = useState(Boolean(initialAiPrompt))
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [nlpSummary, setNlpSummary] = useState<string | null>(null)
  const [aiMatchesMap, setAiMatchesMap] = useState<Record<string, AiMatchScore> | null>(null)
  const [suggestedIdea, setSuggestedIdea] = useState<AiSearchQueryResult['suggestedIdea'] | null>(null)
  const [appliedAiPrompt, setAppliedAiPrompt] = useState('')

  // Keep a ref to allRecipes for the callback without unnecessary re-attachments
  const allRecipesRef = useRef(allRecipes)
  useEffect(() => {
    allRecipesRef.current = allRecipes
  }, [allRecipes])

  // Guard against asynchronous race conditions and URL sync loops
  const aiRequestSequenceRef = useRef(0)
  const latestPromptRef = useRef(initialAiPrompt)
  const lastSyncedUrlQRef = useRef(initialQuery)
  const lastSyncedUrlAiRef = useRef('')

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

  const submitAiPrompt = useCallback(async (promptText: string) => {
    const trimmed = promptText.trim()
    const requestSequence = ++aiRequestSequenceRef.current
    latestPromptRef.current = trimmed
    lastSyncedUrlAiRef.current = trimmed
    setAiPrompt(trimmed)

    if (!trimmed) {
      setAppliedAiPrompt('')
      setNlpSummary(null)
      setAiMatchesMap(null)
      setSuggestedIdea(null)
      setIsAiLoading(false)
      return
    }

    try {
      setIsAiLoading(true)

      const summaryList: RecipeSummaryForAi[] = allRecipesRef.current
        .filter(r => Boolean(r.id))
        .map(r => {
          const cals = r.nutritionalInfo?.perServing?.calories ?? r.nutritionalInfo?.total?.calories
          const ingList = Array.isArray(r.ingredients)
            ? r.ingredients.map(ing => (typeof ing === 'string' ? ing : (ing as { item?: string })?.item || ''))
            : []
          return {
            id: r.id!,
            recipeName: r.recipeName,
            description: r.description,
            tags: r.tags,
            ingredients: ingList,
            prepTimeMinutes: r.prepTimeMinutes,
            calories: typeof cals === 'number' ? cals : undefined,
          }
        })

      const result = await queryAiSearch(trimmed, summaryList)

      if (aiRequestSequenceRef.current !== requestSequence || latestPromptRef.current !== trimmed) {
        return
      }

      const matchesMap: Record<string, AiMatchScore> = {}
      if (Array.isArray(result.matches)) {
        result.matches.forEach(m => {
          matchesMap[m.recipeId] = { score: m.matchScore, reason: m.matchReason }
        })
      }

      setAiMatchesMap(matchesMap)
      setSuggestedIdea(result.suggestedIdea || null)
      setAppliedAiPrompt(trimmed)

      if (result.matches && result.matches.length > 0) {
        setNlpSummary(`${result.matches.length} matching ${result.matches.length === 1 ? 'recipe' : 'recipes'} found`)
      } else if (result.suggestedIdea) {
        setNlpSummary(`No direct match — suggested: ${result.suggestedIdea.title}`)
      } else {
        setNlpSummary('No matching recipes found')
      }
    } catch {
      if (aiRequestSequenceRef.current !== requestSequence) {
        return
      }
      setAppliedAiPrompt(trimmed)
      setAiMatchesMap({})
      setSuggestedIdea(null)
      setNlpSummary(null)
    } finally {
      if (aiRequestSequenceRef.current === requestSequence) {
        setIsAiLoading(false)
      }
    }
  }, [])

  const clearAiPrompt = useCallback(() => {
    aiRequestSequenceRef.current += 1
    latestPromptRef.current = ''
    lastSyncedUrlAiRef.current = ''
    setAiPrompt('')
    setAppliedAiPrompt('')
    setNlpSummary(null)
    setAiMatchesMap(null)
    setSuggestedIdea(null)
    setIsAiLoading(false)
  }, [])

  // Listen for incoming URL parameter changes (e.g. from Dashboard navigation or browser history)
  useEffect(() => {
    const urlQ = searchParams.get('q') || ''
    const urlAi = searchParams.get('ai_prompt') || ''
    const urlTag = searchParams.get('tag')
    const urlDiet = searchParams.get('diet') ? searchParams.get('diet')!.split(',') : (urlTag ? [urlTag] : [])

    if (urlQ !== lastSyncedUrlQRef.current) {
      lastSyncedUrlQRef.current = urlQ
      setSearchText(urlQ)
    }

    if (urlAi !== lastSyncedUrlAiRef.current) {
      lastSyncedUrlAiRef.current = urlAi
      submitAiPrompt(urlAi)
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
  }, [searchParams, submitAiPrompt])

  // Sync internal state out to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (searchText.trim()) params.set('q', searchText.trim())
    else params.delete('q')

    if (aiPrompt.trim()) params.set('ai_prompt', aiPrompt.trim())
    else params.delete('ai_prompt')

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
      lastSyncedUrlQRef.current = searchText.trim()
      lastSyncedUrlAiRef.current = aiPrompt.trim()
      setSearchParams(params, { replace: true })
    }
  }, [searchText, aiPrompt, filters, sortOption, viewMode])

  // Filter & Sort Pipeline
  const filteredAndSortedRecipes = useMemo(() => {
    const filtered = filterRecipes(allRecipes, filters, searchText, aiMatchesMap, appliedAiPrompt)
    if (aiMatchesMap && Object.keys(aiMatchesMap).length > 0 && sortOption === 'relevance') {
      return [...filtered].sort((a, b) => {
        const scoreA = (a.id ? aiMatchesMap[a.id]?.score : undefined) ?? 0
        const scoreB = (b.id ? aiMatchesMap[b.id]?.score : undefined) ?? 0
        return scoreB - scoreA
      })
    }
    return sortRecipes(filtered, sortOption)
  }, [allRecipes, filters, searchText, aiMatchesMap, appliedAiPrompt, sortOption])

  const clearAllFilters = useCallback(() => {
    setSearchText('')
    clearAiPrompt()
    setFilters(DEFAULT_RECIPE_FILTERS)
    setSortOption('relevance')
  }, [clearAiPrompt])

  const removeDietaryTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.filter(t => t !== tag),
    }))
  }, [])

  return {
    searchText,
    setSearchText,
    aiPrompt,
    setAiPrompt,
    submitAiPrompt,
    clearAiPrompt,
    isAiPromptOpen,
    setIsAiPromptOpen,
    isAiLoading,
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
    aiMatchesMap,
    suggestedIdea,
  }
}

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  type RecipeFilterState,
  type AiMatchScore,
  DEFAULT_RECIPE_FILTERS,
  DIETARY_OPTIONS,
  PREP_TIME_OPTIONS,
  CALORIE_OPTIONS,
  getActiveFilterCount,
  filterRecipes,
} from '../../features/recipes/utils/recipeFiltering'
import type { Recipe } from '../../types/nutrition'
import { FilterTypeaheadCombobox } from './FilterTypeaheadCombobox'

export interface RecipeFilterDrawerProps {
  isOpen: boolean
  onToggleOpen: () => void
  filters: RecipeFilterState
  availableTags?: string[]
  availableIngredients?: string[]
  hideHeaderButton?: boolean
  matchingCount?: number
  allRecipes?: Recipe[]
  searchText?: string
  aiMatchesMap?: Record<string, AiMatchScore> | null
  appliedAiPrompt?: string
  onFiltersChange: (newFilters: RecipeFilterState) => void
  onClearFilters: () => void
}

export const RecipeFilterDrawer: React.FC<RecipeFilterDrawerProps> = ({
  isOpen,
  onToggleOpen,
  filters,
  availableTags = [],
  availableIngredients = [],
  hideHeaderButton = false,
  matchingCount,
  allRecipes,
  searchText = '',
  aiMatchesMap = null,
  appliedAiPrompt = '',
  onFiltersChange,
  onClearFilters,
}) => {
  const [draftFilters, setDraftFilters] = useState<RecipeFilterState>(filters)
  const [incInput, setIncInput] = useState('')
  const [excInput, setExcInput] = useState('')
  const [incSuggestionsOpen, setIncSuggestionsOpen] = useState(false)
  const [excSuggestionsOpen, setExcSuggestionsOpen] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)

  // Adjust draft filters during render only when dialog opens
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setDraftFilters(filters)
    }
  }

  const onToggleOpenRef = useRef(onToggleOpen)
  useEffect(() => {
    onToggleOpenRef.current = onToggleOpen
  }, [onToggleOpen])

  // Count active filters for external trigger and modal draft
  const activeExternalCount = getActiveFilterCount(filters)
  const activeDraftCount = getActiveFilterCount(draftFilters)

  // Live matching count calculated dynamically against draft filters
  const liveMatchingCount = useMemo(() => {
    if (allRecipes) {
      return filterRecipes(allRecipes, draftFilters, searchText, aiMatchesMap, appliedAiPrompt).length
    }
    return matchingCount
  }, [allRecipes, draftFilters, searchText, aiMatchesMap, appliedAiPrompt, matchingCount])

  // Focus management: store previous active element, trap Tab focus, and restore on close
  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null

    // Focus the first focusable element inside the modal on open
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        firstFocusable?.focus()
      }
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onToggleOpenRef.current()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) {
          e.preventDefault()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedElementRef.current?.focus()
    }
  }, [isOpen])

  // Prevent background body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const setMaxPrepTime = (value: number | null) => {
    setDraftFilters(prev => ({
      ...prev,
      maxPrepTime: prev.maxPrepTime === value ? null : value,
    }))
  }

  const setMaxCalories = (value: number | null) => {
    setDraftFilters(prev => ({
      ...prev,
      maxCalories: prev.maxCalories === value ? null : value,
    }))
  }

  const handleAddIncludeIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim()
    if (!trimmed) return
    if (!draftFilters.includeIngredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setDraftFilters(prev => ({
        ...prev,
        includeIngredients: [...prev.includeIngredients, trimmed],
      }))
    }
    setIncInput('')
    setIncSuggestionsOpen(false)
  }

  const handleRemoveIncludeIngredient = (item: string) => {
    setDraftFilters(prev => ({
      ...prev,
      includeIngredients: prev.includeIngredients.filter(i => i !== item),
    }))
  }

  const handleAddExcludeIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim()
    if (!trimmed) return
    if (!draftFilters.excludeIngredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setDraftFilters(prev => ({
        ...prev,
        excludeIngredients: [...prev.excludeIngredients, trimmed],
      }))
    }
    setExcInput('')
    setExcSuggestionsOpen(false)
  }

  const handleRemoveExcludeIngredient = (item: string) => {
    setDraftFilters(prev => ({
      ...prev,
      excludeIngredients: prev.excludeIngredients.filter(i => i !== item),
    }))
  }

  const handleApply = () => {
    onFiltersChange(draftFilters)
    onToggleOpen()
  }

  const handleCancel = () => {
    setDraftFilters(filters)
    onToggleOpen()
  }

  // Filter ingredient suggestions
  const filteredIncIngredients = React.useMemo(() => {
    const q = incInput.trim().toLowerCase()
    if (!q) return []
    return availableIngredients
      .filter(
        ing =>
          ing.toLowerCase().includes(q) &&
          !draftFilters.includeIngredients.some(sel => sel.toLowerCase() === ing.toLowerCase())
      )
      .slice(0, 6)
  }, [availableIngredients, incInput, draftFilters.includeIngredients])

  const filteredExcIngredients = React.useMemo(() => {
    const q = excInput.trim().toLowerCase()
    if (!q) return []
    return availableIngredients
      .filter(
        ing =>
          ing.toLowerCase().includes(q) &&
          !draftFilters.excludeIngredients.some(sel => sel.toLowerCase() === ing.toLowerCase())
      )
      .slice(0, 6)
  }, [availableIngredients, excInput, draftFilters.excludeIngredients])

  return (
    <>
      {/* Optional Standalone Trigger Button */}
      {!hideHeaderButton && (
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onToggleOpen}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {activeExternalCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-emerald-600 text-white rounded-full">
                {activeExternalCount}
              </span>
            )}
          </button>

          {activeExternalCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              Clear all filters ({activeExternalCount})
            </button>
          )}
        </div>
      )}

      {/* Modal Dialog with Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-850 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-750 overflow-hidden flex flex-col max-h-[90vh] z-10 focus:outline-none"
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-dialog-title"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="filter-dialog-title" className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                      Filter Recipes
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Narrow by dietary needs, recipe tags, time, and pantry ingredients
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activeDraftCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftFilters(DEFAULT_RECIPE_FILTERS)}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Reset all ({activeDraftCount})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close filter dialog"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-5 overflow-y-auto space-y-6">
                {/* Facet 1: Dietary Requirements & Recipe Tags (Separated Typeaheads) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Dietary Requirements */}
                  <div>
                    <FilterTypeaheadCombobox
                      id="dietary-requirements-filter"
                      label="Dietary Requirements"
                      placeholder="Search diet (e.g. Vegan, Keto)..."
                      icon="🥗"
                      options={DIETARY_OPTIONS}
                      selected={draftFilters.dietaryTags}
                      onChange={newDiet => setDraftFilters(prev => ({ ...prev, dietaryTags: newDiet }))}
                      quickOptions={['Vegetarian', 'Vegan', 'Gluten-Free']}
                      chipColor="emerald"
                    />
                  </div>

                  {/* Recipe Category Tags */}
                  <div>
                    <FilterTypeaheadCombobox
                      id="recipe-tags-filter"
                      label="Recipe Tags"
                      placeholder="Search tags (e.g. Italian, Dinner)..."
                      icon="🏷️"
                      options={availableTags}
                      selected={draftFilters.tags || []}
                      onChange={newTags => setDraftFilters(prev => ({ ...prev, tags: newTags }))}
                      allowCustom={true}
                      chipColor="indigo"
                    />
                  </div>
                </div>

                {/* Facet 2: Prep Time & Calorie Limit Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-100 dark:border-slate-800">
                  {/* Max Prep/Cook Time */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      ⏱️ Max Prep & Cook Time
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 dark:bg-slate-900 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setMaxPrepTime(null)}
                        className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                          draftFilters.maxPrepTime === null
                            ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-2xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        Any
                      </button>
                      {PREP_TIME_OPTIONS.map(opt => {
                        const isSelected = draftFilters.maxPrepTime === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setMaxPrepTime(opt.value)}
                            className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                          >
                            {opt.label.replace(' mins', 'm')}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Max Calories */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      🔥 Max Calories
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 dark:bg-slate-900 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setMaxCalories(null)}
                        className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                          draftFilters.maxCalories === null
                            ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-2xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        Any
                      </button>
                      {CALORIE_OPTIONS.map(opt => {
                        const isSelected = draftFilters.maxCalories === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setMaxCalories(opt.value)}
                            className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                          >
                            {opt.label.replace(' kcal', '')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Facet 3: Pantry Ingredients (Must Include & Exclude with Autocomplete) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-100 dark:border-slate-800">
                  {/* Must Include Ingredients */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      🥕 Must Include Ingredients
                    </label>
                    <form
                      onSubmit={e => {
                        e.preventDefault()
                        handleAddIncludeIngredient(incInput)
                      }}
                      className="flex gap-2 mb-2"
                    >
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={incInput}
                          onChange={e => {
                            setIncInput(e.target.value)
                            setIncSuggestionsOpen(true)
                          }}
                          onFocus={() => setIncSuggestionsOpen(true)}
                          placeholder="e.g. Garlic, Tomato..."
                          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 shadow-2xs"
                        />
                        {incSuggestionsOpen && filteredIncIngredients.length > 0 && (
                          <div className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 text-xs">
                            {filteredIncIngredients.map(ing => (
                              <button
                                key={ing}
                                type="button"
                                onClick={() => handleAddIncludeIngredient(ing)}
                                className="w-full px-3 py-1.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
                              >
                                + {ing}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        Add
                      </button>
                    </form>
                    <div className="flex flex-wrap gap-1.5">
                      {draftFilters.includeIngredients.map(item => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium rounded-lg"
                        >
                          +{item}
                          <button
                            type="button"
                            onClick={() => handleRemoveIncludeIngredient(item)}
                            className="hover:text-red-500 ml-0.5 cursor-pointer"
                            aria-label={`Remove ingredient ${item}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Exclude Allergens / Ingredients */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      🚫 Exclude Allergens / Ingredients
                    </label>
                    <form
                      onSubmit={e => {
                        e.preventDefault()
                        handleAddExcludeIngredient(excInput)
                      }}
                      className="flex gap-2 mb-2"
                    >
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={excInput}
                          onChange={e => {
                            setExcInput(e.target.value)
                            setExcSuggestionsOpen(true)
                          }}
                          onFocus={() => setExcSuggestionsOpen(true)}
                          placeholder="e.g. Peanuts, Dairy..."
                          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 shadow-2xs"
                        />
                        {excSuggestionsOpen && filteredExcIngredients.length > 0 && (
                          <div className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 text-xs">
                            {filteredExcIngredients.map(ing => (
                              <button
                                key={ing}
                                type="button"
                                onClick={() => handleAddExcludeIngredient(ing)}
                                className="w-full px-3 py-1.5 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
                              >
                                - {ing}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        Exclude
                      </button>
                    </form>
                    <div className="flex flex-wrap gap-1.5">
                      {draftFilters.excludeIngredients.map(item => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-medium rounded-lg"
                        >
                          -{item}
                          <button
                            type="button"
                            onClick={() => handleRemoveExcludeIngredient(item)}
                            className="hover:text-red-500 ml-0.5 cursor-pointer"
                            aria-label={`Remove exclusion ${item}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-5 py-3.5 bg-gray-50/80 dark:bg-slate-900/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {activeDraftCount === 0 ? 'No filters currently applied' : `${activeDraftCount} active filter${activeDraftCount === 1 ? '' : 's'}`}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={liveMatchingCount === 0}
                    className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer ${
                      liveMatchingCount === 0
                        ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {liveMatchingCount !== undefined
                      ? liveMatchingCount === 0
                        ? '0 Recipes Match'
                        : `Show ${liveMatchingCount} Recipe${liveMatchingCount === 1 ? '' : 's'}`
                      : 'Apply Filters'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

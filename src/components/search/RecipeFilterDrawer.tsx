import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseAiSearchIntent } from '../../utils/aiApi'
import {
  type RecipeFilterState,
  DIETARY_OPTIONS,
  PREP_TIME_OPTIONS,
  CALORIE_OPTIONS,
  getActiveFilterCount,
} from '../../features/recipes/utils/recipeFiltering'

export interface RecipeFilterDrawerProps {
  isOpen: boolean
  onToggleOpen: () => void
  filters: RecipeFilterState
  searchText?: string
  onSearchTextChange?: (text: string) => void
  availableTags?: string[]
  hideHeaderButton?: boolean
  onFiltersChange: (newFilters: RecipeFilterState) => void
  onClearFilters: () => void
}

export const RecipeFilterDrawer: React.FC<RecipeFilterDrawerProps> = ({
  isOpen,
  onToggleOpen,
  filters,
  searchText = '',
  onSearchTextChange,
  availableTags = [],
  hideHeaderButton = false,
  onFiltersChange,
  onClearFilters,
}) => {
  const [incInput, setIncInput] = useState('')
  const [excInput, setExcInput] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)

  const handleApplyAiFilters = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiPrompt.trim() || isAiLoading) return
    setIsAiLoading(true)
    setAiExplanation(null)

    try {
      const result = await parseAiSearchIntent(aiPrompt)
      if (result.queryKeywords && onSearchTextChange) {
        onSearchTextChange(result.queryKeywords)
      }

      const mergedTags = Array.from(new Set([...filters.dietaryTags, ...(result.dietaryTags || [])]))

      onFiltersChange({
        ...filters,
        dietaryTags: mergedTags,
        maxPrepTime: result.maxPrepTime !== undefined && result.maxPrepTime !== null ? result.maxPrepTime : filters.maxPrepTime,
        maxCalories: result.maxCalories !== undefined && result.maxCalories !== null ? result.maxCalories : filters.maxCalories,
      })

      if (result.explanation) {
        setAiExplanation(result.explanation)
      }
    } catch (err) {
      console.error('AI filter parse failed:', err)
      setAiExplanation('Failed to interpret prompt. Using standard search.')
    } finally {
      setIsAiLoading(false)
    }
  }

  const activeCount = getActiveFilterCount(filters)

  const toggleDietaryTag = (tag: string) => {
    const isSelected = filters.dietaryTags.includes(tag)
    const updated = isSelected
      ? filters.dietaryTags.filter(t => t !== tag)
      : [...filters.dietaryTags, tag]
    onFiltersChange({ ...filters, dietaryTags: updated })
  }

  const setMaxPrepTime = (value: number | null) => {
    onFiltersChange({
      ...filters,
      maxPrepTime: filters.maxPrepTime === value ? null : value,
    })
  }

  const setMaxCalories = (value: number | null) => {
    onFiltersChange({
      ...filters,
      maxCalories: filters.maxCalories === value ? null : value,
    })
  }

  const handleAddIncludeIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!incInput.trim()) return
    const trimmed = incInput.trim()
    if (!filters.includeIngredients.includes(trimmed)) {
      onFiltersChange({
        ...filters,
        includeIngredients: [...filters.includeIngredients, trimmed],
      })
    }
    setIncInput('')
  }

  const handleRemoveIncludeIngredient = (item: string) => {
    onFiltersChange({
      ...filters,
      includeIngredients: filters.includeIngredients.filter(i => i !== item),
    })
  }

  const handleAddExcludeIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!excInput.trim()) return
    const trimmed = excInput.trim()
    if (!filters.excludeIngredients.includes(trimmed)) {
      onFiltersChange({
        ...filters,
        excludeIngredients: [...filters.excludeIngredients, trimmed],
      })
    }
    setExcInput('')
  }

  const handleRemoveExcludeIngredient = (item: string) => {
    onFiltersChange({
      ...filters,
      excludeIngredients: filters.excludeIngredients.filter(i => i !== item),
    })
  }

  const combinedTags = useMemo(() => {
    const set = new Set([...DIETARY_OPTIONS, ...availableTags])
    return Array.from(set).filter(Boolean)
  }, [availableTags])

  return (
    <div className="w-full">
      {/* Drawer Toggle Header */}
      {!hideHeaderButton && (
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onToggleOpen}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors shadow-xs"
          >
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-emerald-600 text-white rounded-full">
                {activeCount}
              </span>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Clear all filters ({activeCount})
            </button>
          )}
        </div>
      )}

      {/* Drawer Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden mb-4"
          >
            <div className="p-5 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-5">
              {/* AI Natural Language Filter Assistant */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>✨</span> Auto-Fill Filters with AI
                  </label>
                  {aiExplanation && (
                    <button
                      type="button"
                      onClick={() => setAiExplanation(null)}
                      className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
                <form onSubmit={handleApplyAiFilters} className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. 'Quick low-carb pasta under 500 kcal'"
                    className="flex-1 px-3 py-1.5 text-xs border border-emerald-500/30 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 shadow-xs"
                  >
                    {isAiLoading ? 'Parsing...' : 'Apply AI Filters'}
                  </button>
                </form>
                {aiExplanation && (
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic bg-emerald-500/10 p-2 rounded-md">
                    🤖 {aiExplanation}
                  </p>
                )}
              </div>

              {/* Keyword Search Query */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Keyword Search Query
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchText}
                    onChange={e => onSearchTextChange?.(e.target.value)}
                    placeholder="Search by title, description or tag..."
                    className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchText && (
                    <button
                      type="button"
                      onClick={() => onSearchTextChange?.('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-red-500 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Tags & Dietary Restrictions */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                  Tags & Dietary Restrictions
                </label>
                <div className="flex flex-wrap gap-2">
                  {combinedTags.map((tag: string) => {
                    const isSelected = filters.dietaryTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDietaryTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Prep & Cook Time Presets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                    Max Prep & Cook Time
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PREP_TIME_OPTIONS.map(opt => {
                      const isSelected = filters.maxPrepTime === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMaxPrepTime(opt.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Calorie Limit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                    Max Calories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CALORIE_OPTIONS.map(opt => {
                      const isSelected = filters.maxCalories === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMaxCalories(opt.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Pantry Ingredients */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-slate-800">
                {/* Include Ingredients */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Must Include Ingredients
                  </label>
                  <form onSubmit={handleAddIncludeIngredient} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={incInput}
                      onChange={e => setIncInput(e.target.value)}
                      placeholder="e.g. Garlic, Tomato..."
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      Add
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-1.5">
                    {filters.includeIngredients.map(item => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg"
                      >
                        +{item}
                        <button
                          type="button"
                          onClick={() => handleRemoveIncludeIngredient(item)}
                          className="hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Exclude Ingredients */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Exclude Allergens / Ingredients
                  </label>
                  <form onSubmit={handleAddExcludeIngredient} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={excInput}
                      onChange={e => setExcInput(e.target.value)}
                      placeholder="e.g. Peanuts, Dairy..."
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Add
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-1.5">
                    {filters.excludeIngredients.map(item => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-medium rounded-lg"
                      >
                        -{item}
                        <button
                          type="button"
                          onClick={() => handleRemoveExcludeIngredient(item)}
                          className="hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

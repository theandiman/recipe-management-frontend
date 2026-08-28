import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  onFiltersChange: (newFilters: RecipeFilterState) => void
  onClearFilters: () => void
}

export const RecipeFilterDrawer: React.FC<RecipeFilterDrawerProps> = ({
  isOpen,
  onToggleOpen,
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [incInput, setIncInput] = useState('')
  const [excInput, setExcInput] = useState('')

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

  return (
    <div className="w-full mb-6">
      {/* Toggle Bar */}
      <div className="flex items-center justify-between">
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

      {/* Drawer Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-5">
              {/* Dietary Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                  Dietary Restrictions & Badges
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(tag => {
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

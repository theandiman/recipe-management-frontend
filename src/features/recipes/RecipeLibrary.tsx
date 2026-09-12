import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecipes, deleteRecipe } from '../../services/recipeStorageApi'
import RecipeCard from '../../components/RecipeCard'
import RecipeListItem from '../../components/RecipeListItem'
import { ViewModeToggle } from '../../components/common/ViewModeToggle'
import { RecipeCardSkeleton } from '../../components/skeletons/RecipeCardSkeleton'
import { RecipeFilterDrawer } from '../../components/search/RecipeFilterDrawer'
import { AiSearchPromptBar } from '../../components/search/AiSearchPromptBar'
import { useOmniSearch } from '../../components/search/OmniSearchContext'
import { useRecipeSearchFilters } from './hooks/useRecipeSearchFilters'
import { SORT_OPTIONS, type SortOption } from './utils/recipeSorting'
import { getActiveFilterCount } from './utils/recipeFiltering'
import type { Recipe } from '../../types/nutrition'
import { useAuth } from '../auth/AuthContext'

export const RecipeLibrary: React.FC = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { searchQuery, setSearchQuery } = useOmniSearch()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // Custom Search & Multi-Facet Filtering Hook
  const {
    searchText,
    setSearchText,
    aiPrompt,
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
    filteredAndSortedRecipes: filtered,
    clearAllFilters,
    removeDietaryTag,
    removeTag,
    availableTags,
    availableIngredients,
    nlpSummary,
    aiMatchesMap,
    suggestedIdea,
  } = useRecipeSearchFilters(recipes)

  // Sync top nav search bar with page search text
  useEffect(() => {
    if (searchQuery && searchQuery !== searchText) {
      setSearchText(searchQuery)
    }
  }, [searchQuery])

  useEffect(() => {
    if (searchText !== searchQuery) {
      setSearchQuery(searchText)
    }
  }, [searchText])

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getRecipes()
        setRecipes(data)
      } catch (err: unknown) {
        console.error('Failed to fetch recipes:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recipes'
        const apiError = err as { response?: { data?: { message?: string } } }
        setError(apiError.response?.data?.message || errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      setDeleting(true)
      await deleteRecipe(deleteConfirm.id)
      setRecipes(recipes.filter(r => r.id !== deleteConfirm.id))
      setDeleteConfirm(null)
    } catch (err: unknown) {
      console.error('Failed to delete recipe:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recipe'
      const apiError = err as { response?: { data?: { message?: string } } }
      setError(apiError.response?.data?.message || errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm(null)
  }

  const activeFilterCount = getActiveFilterCount(filters)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Cookbook</h1>
          <p className="text-gray-600 dark:text-gray-300">Browse and manage your recipe collection</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: "easeOut",
                delay: index * 0.1 
              }}
            >
              <RecipeCardSkeleton />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Cookbook</h1>
          <p className="text-gray-600 dark:text-gray-300">Browse and manage your recipe collection</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading recipes</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Cookbook</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Browse and manage your recipe collection</p>
        </div>
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.svg 
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </motion.svg>
          <motion.h3 
            className="mt-4 text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            No recipes yet
          </motion.h3>
          <motion.p 
            className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            Get started by generating your first recipe!
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/create')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Create Recipe
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/generate')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Try AI Generator
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">My Cookbook</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
          Browse and manage your recipe collection ({filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'})
        </p>
      </div>

      {/* Unified Action & Filter Toolbar Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Plain-text search input + Filter & AI Triggers */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 min-w-[280px]">
          {/* Plain Text Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <svg
              className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              aria-label="Search recipes"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search title, tag, ingredients..."
              className="w-full pl-9 pr-7 py-2 text-xs sm:text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-red-500 text-xs font-bold cursor-pointer"
                aria-label="Clear keyword search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(prev => !prev)}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs ${
              isFilterDrawerOpen
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] sm:text-xs font-bold bg-emerald-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* ✨ Ask AI Trigger Button */}
          <button
            type="button"
            aria-expanded={isAiPromptOpen}
            aria-controls="recipe-ai-search-prompt-bar"
            onClick={() => setIsAiPromptOpen(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs ${
              aiPrompt
                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                : isAiPromptOpen
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600'
                : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}
            title="Search with Natural Language AI Prompt"
          >
            <span>✨</span>
            <span>Ask AI</span>
            {aiPrompt && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline ml-1"
            >
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Right Side: Sort Select & View Mode Switcher Grouped Together */}
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1">
            <label htmlFor="sort-select" className="sr-only">Sort recipes</label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3.5 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher (Grid vs List) */}
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {/* Expandable AI Search Prompt Bar */}
      <AiSearchPromptBar
        id="recipe-ai-search-prompt-bar"
        isOpen={isAiPromptOpen}
        onClose={() => setIsAiPromptOpen(false)}
        activePrompt={aiPrompt}
        nlpSummary={nlpSummary}
        isLoading={isAiLoading}
        onSubmitPrompt={submitAiPrompt}
        onClearPrompt={clearAiPrompt}
      />

      {/* Multi-Facet Filter Drawer / Dialog Panel (Header Hidden) */}
      <RecipeFilterDrawer
        isOpen={isFilterDrawerOpen}
        onToggleOpen={() => setIsFilterDrawerOpen(prev => !prev)}
        filters={filters}
        availableTags={availableTags}
        availableIngredients={availableIngredients}
        matchingCount={filtered.length}
        hideHeaderButton
        onFiltersChange={setFilters}
        onClearFilters={clearAllFilters}
      />

      {/* Active Filter Pills Bar */}
      {(activeFilterCount > 0 || searchText || aiPrompt) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active:</span>
          {aiPrompt && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30">
              <span>✨ AI:</span> "{aiPrompt}"{nlpSummary ? ` (${nlpSummary})` : ''}
              <button type="button" onClick={clearAiPrompt} className="hover:text-red-500 font-bold ml-1 cursor-pointer" title="Clear AI prompt" aria-label="Clear AI prompt">✕</button>
            </span>
          )}
          {searchText && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
              Query: "{searchText}"
              <button type="button" onClick={() => setSearchText('')} className="hover:text-red-500 font-bold cursor-pointer" title="Clear query" aria-label="Clear query">✕</button>
            </span>
          )}
          {filters.dietaryTags.map(diet => (
            <span key={diet} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
              Diet: {diet}
              <button
                type="button"
                onClick={() => removeDietaryTag(diet)}
                className="hover:text-red-500 font-bold cursor-pointer"
                aria-label={`Remove diet ${diet}`}
              >
                ✕
              </button>
            </span>
          ))}
          {(filters.tags || []).map(tag => (
            <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full border border-indigo-200 dark:border-indigo-900">
              Tag: #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-500 font-bold cursor-pointer"
                aria-label={`Remove tag ${tag}`}
              >
                ✕
              </button>
            </span>
          ))}
          {filters.maxPrepTime !== null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
              Max Time: &lt; {filters.maxPrepTime} min
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, maxPrepTime: null }))}
                className="hover:text-red-500 font-bold cursor-pointer"
                aria-label="Remove max time limit"
              >
                ✕
              </button>
            </span>
          )}
          {filters.maxCalories !== null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
              Max Calories: &lt; {filters.maxCalories} kcal
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, maxCalories: null }))}
                className="hover:text-red-500 font-bold cursor-pointer"
                aria-label="Remove max calories limit"
              >
                ✕
              </button>
            </span>
          )}
          {filters.includeIngredients.map(ing => (
            <span key={ing} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
              +{ing}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, includeIngredients: prev.includeIngredients.filter(i => i !== ing) }))}
                className="hover:text-red-500 font-bold cursor-pointer"
                aria-label={`Remove ingredient ${ing}`}
              >
                ✕
              </button>
            </span>
          ))}
          {filters.excludeIngredients.map(ing => (
            <span key={ing} className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-medium rounded-full border border-red-200 dark:border-red-900">
              -{ing}
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, excludeIngredients: prev.excludeIngredients.filter(i => i !== ing) }))}
                className="hover:text-red-500 font-bold cursor-pointer"
                aria-label={`Remove exclusion ${ing}`}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline ml-2 cursor-pointer"
          >
            Reset all
          </button>
        </div>
      )}

      {/* Paged recipes rendering */}
      {(() => {
        const total = filtered.length
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        if (currentPage > totalPages) setCurrentPage(1)
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        const paged = filtered.slice(start, end)

        return (
          <>
            {/* Grid View vs List View */}
            {viewMode === 'grid' ? (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentPage}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {paged.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onView={(id) => navigate(`/dashboard/recipes/${id}`)}
                      onDelete={(currentUser && (!recipe.userId || recipe.userId === currentUser.uid)) ? ((r) => r.id && setDeleteConfirm({ id: r.id, title: r.recipeName })) : undefined}
                      showBookmark
                      matchReason={recipe.id && aiMatchesMap ? aiMatchesMap[recipe.id]?.reason : undefined}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {paged.map((recipe) => {
                    const isOwner = Boolean(currentUser && (!recipe.userId || recipe.userId === currentUser.uid))
                    return (
                      <RecipeListItem
                        key={recipe.id}
                        recipe={recipe}
                        onView={(id) => navigate(`/dashboard/recipes/${id}`)}
                        onDelete={isOwner ? ((r) => r.id && setDeleteConfirm({ id: r.id, title: r.recipeName })) : undefined}
                        isOwner={isOwner}
                        showBookmark
                        matchReason={recipe.id && aiMatchesMap ? aiMatchesMap[recipe.id]?.reason : undefined}
                      />
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Smart Empty Filter State */}
            {filtered.length === 0 && (
              <motion.div 
                className="mt-8 text-center py-10 px-4 bg-white dark:bg-slate-850 border border-dashed border-emerald-500/30 dark:border-emerald-500/30 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-indigo-500/5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {suggestedIdea ? (
                  <div className="max-w-md mx-auto mb-4 p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-left">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">
                      <span>✨</span> AI Suggested Idea
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {suggestedIdea.title}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {suggestedIdea.reason}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-900 dark:text-gray-100 font-bold mb-2">
                    No recipes found in your cookbook{searchText ? ` for "${searchText}"` : (aiPrompt ? ` for "${aiPrompt}"` : '')}.
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  {suggestedIdea
                    ? 'None of your existing recipes matched, but AI Kitchen can craft this recipe for you now!'
                    : 'Try clearing active search filters or let AI Kitchen generate a custom recipe for you in seconds.'}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/generate?prompt=${encodeURIComponent(suggestedIdea?.prompt || aiPrompt || searchText)}`)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <span>✨</span> Generate {suggestedIdea ? `"${suggestedIdea.title}"` : (aiPrompt ? `"${aiPrompt}"` : (searchText ? `"${searchText}"` : ''))} with AI Kitchen
                  </button>
                </div>
              </motion.div>
            )}

            {/* Pagination controls */}
            {filtered.length > pageSize && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {Math.min(start + 1, total)} - {Math.min(end, total)} of {total}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      aria-current={p === currentPage}
                      className={`px-3 py-1 rounded ${p === currentPage ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200'}`}
                      aria-label={`Go to page ${p}`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded disabled:opacity-50"
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Recipe</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">"{deleteConfirm.title}"</span>? <span>This action cannot be undone</span>.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Sticky Floating Filter Action Bar */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3 bg-slate-900/90 dark:bg-emerald-600/95 backdrop-blur-md text-white font-bold text-xs rounded-full shadow-2xl border border-white/20 active:scale-95 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 text-emerald-400 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filter & Sort</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500 dark:bg-slate-900 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecipes, deleteRecipe } from '../../services/recipeStorageApi'
import RecipeCard from '../../components/RecipeCard'
import { RecipeCardSkeleton } from '../../components/skeletons/RecipeCardSkeleton'
import { RecipeFilterDrawer } from '../../components/search/RecipeFilterDrawer'
import { useOmniSearch } from '../../components/search/OmniSearchContext'
import { useRecipeSearchFilters } from './hooks/useRecipeSearchFilters'
import { SORT_OPTIONS, type SortOption } from './utils/recipeSorting'
import { getActiveFilterCount } from './utils/recipeFiltering'
import type { Recipe } from '../../types/nutrition'

export const RecipeLibrary: React.FC = () => {
  const navigate = useNavigate()
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
  } = useRecipeSearchFilters(recipes)

  // Bidirectional sync between top bar searchQuery and page searchText
  useEffect(() => {
    if (searchQuery !== searchText) {
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

  // Tags list for quick select
  const tags = useMemo(() => Array.from(new Set(recipes.flatMap(r => r.tags || []))).filter(Boolean), [recipes])

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
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">My Cookbook</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
              Browse and manage your recipe collection ({filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'})
            </p>
          </div>

          {/* View Mode Switcher (Grid vs List) */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px]">
            {/* Multi-Facet Filter Drawer */}
            <RecipeFilterDrawer
              isOpen={isFilterDrawerOpen}
              onToggleOpen={() => setIsFilterDrawerOpen(prev => !prev)}
              filters={filters}
              searchText={searchText}
              onSearchTextChange={setSearchText}
              availableTags={tags}
              onFiltersChange={setFilters}
              onClearFilters={clearAllFilters}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <label htmlFor="sort-select" className="sr-only">Sort recipes</label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {(activeFilterCount > 0 || searchText) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active:</span>
            {searchText && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
                Query: "{searchText}"
                <button onClick={() => setSearchText('')} className="hover:text-red-500 font-bold">✕</button>
              </span>
            )}
            {filters.dietaryTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
                Tag: {tag}
                <button
                  onClick={() => setFilters(prev => ({ ...prev, dietaryTags: prev.dietaryTags.filter(t => t !== tag) }))}
                  className="hover:text-red-500 font-bold"
                >
                  ✕
                </button>
              </span>
            ))}
            {filters.maxPrepTime !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
                Max Time: &lt; {filters.maxPrepTime} min
                <button
                  onClick={() => setFilters(prev => ({ ...prev, maxPrepTime: null }))}
                  className="hover:text-red-500 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {filters.maxCalories !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
                Max Calories: &lt; {filters.maxCalories} kcal
                <button
                  onClick={() => setFilters(prev => ({ ...prev, maxCalories: null }))}
                  className="hover:text-red-500 font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline ml-2"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

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
                      onDelete={(r) => r.id && setDeleteConfirm({ id: r.id, title: r.recipeName })}
                      showBookmark
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
                  {paged.map((recipe) => (
                    <div
                      key={recipe.id}
                      onClick={() => recipe.id && navigate(`/dashboard/recipes/${recipe.id}`)}
                      className="flex items-center justify-between p-4 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-2xl hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        {recipe.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.recipeName}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {recipe.recipeName[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{recipe.recipeName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{recipe.description || 'No description provided.'}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(recipe.tags || []).slice(0, 3).map(t => (
                              <span key={t} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-[10px] rounded-md font-medium">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                        {recipe.prepTime && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            ⏱ {recipe.prepTime} min
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (recipe.id) setDeleteConfirm({ id: recipe.id, title: recipe.recipeName })
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete recipe"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Smart Empty Filter State */}
            {filtered.length === 0 && (
              <motion.div 
                className="mt-8 text-center py-10 px-4 bg-white dark:bg-slate-850 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-gray-600 dark:text-gray-300 font-medium mb-2">
                  No recipes match your search or selected tag.
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  Try clearing some filter criteria, or generate a custom recipe with AI matching these requirements.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/generate?prompt=${encodeURIComponent(searchText)}`)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
                  >
                    ✨ Generate with AI Kitchen
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
    </div>
  )
}

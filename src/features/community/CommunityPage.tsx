import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getPublicRecipes, getFeed } from '../../services/recipeStorageApi'
import { useAuth } from '../auth/AuthContext'
import RecipeCard from '../../components/RecipeCard'
import { RecipeCardSkeleton } from '../../components/skeletons/RecipeCardSkeleton'
import { RecipeFilterDrawer } from '../../components/search/RecipeFilterDrawer'
import { useOmniSearch } from '../../components/search/OmniSearchContext'
import { useRecipeSearchFilters } from '../recipes/hooks/useRecipeSearchFilters'
import { SORT_OPTIONS, type SortOption } from '../recipes/utils/recipeSorting'
import { getActiveFilterCount } from '../recipes/utils/recipeFiltering'
import type { Recipe } from '../../types/nutrition'

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { searchQuery, setSearchQuery } = useOmniSearch()

  const isFollowingFilter =
    !!user &&
    (searchParams.get('tab') === 'following' || searchParams.get('following') === 'true')

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch community or following feed recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = isFollowingFilter ? await getFeed() : await getPublicRecipes()
        setRecipes(data)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recipes'
        const apiError = err as { response?: { data?: { message?: string } } }
        setError(apiError.response?.data?.message || errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [isFollowingFilter])

  const toggleFollowingFilter = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (isFollowingFilter) {
      searchParams.delete('following')
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ following: 'true' }, { replace: true })
    }
  }

  // Derive unique tags from current recipe set
  const availableTags = useMemo(
    () => Array.from(new Set(recipes.flatMap((r) => r.tags || []))).filter(Boolean),
    [recipes]
  )

  const activeFilterCount = getActiveFilterCount(filters)
  const hasRecipes = !loading && !error && recipes.length > 0

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Community Recipes
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
          {isFollowingFilter
            ? 'Showing recipes from cooks and chefs you follow.'
            : 'Discover recipes shared by home cooks and community chefs.'}
        </p>
      </div>

      {/* Action & Filter Toolbar Bar */}
      {hasRecipes && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {/* Left Side: Filter Trigger Button & Following Quick Filter Chip */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-600 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isFilterDrawerOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Quick Filter: Cooks You Follow */}
              {user && (
                <button
                  type="button"
                  onClick={toggleFollowingFilter}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                    isFollowingFilter
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Cooks You Follow</span>
                </button>
              )}

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Clear all filters ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Right Side: Sort Select & View Mode Switcher */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="community-sort-select" className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Sort by:</label>
                <select
                  id="community-sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="px-3.5 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* View Mode Switcher (Grid vs List) */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Compact list view"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Multi-Facet Filter Drawer Panel */}
          <AnimatePresence>
            {isFilterDrawerOpen && (
              <RecipeFilterDrawer
                isOpen={isFilterDrawerOpen}
                onToggleOpen={() => setIsFilterDrawerOpen((prev) => !prev)}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearAllFilters}
                availableTags={availableTags}
                hideHeaderButton={true}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* Loading Skeleton Grid */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
        </div>
      )}

      {/* Error Message */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading {isFollowingFilter ? 'following feed' : 'community recipes'}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Empty States */}
      {!loading && !error && recipes.length === 0 && !isFollowingFilter && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.svg
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </motion.svg>

          <motion.h3
            className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            No community recipes yet
          </motion.h3>

          <motion.p
            className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Be the first to share a recipe with the community!
          </motion.p>
        </motion.div>
      )}

      {!loading && !error && recipes.length === 0 && isFollowingFilter && (
        <motion.div
          className="text-center py-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto my-8 shadow-xs"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            👥
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            No recipes from cooks you follow
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Follow some cooks to see their recipes in your feed!
          </p>
          <button
            type="button"
            onClick={toggleFollowingFilter}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            Show All Community Recipes
          </button>
        </motion.div>
      )}

      {/* Filtered Empty State */}
      {!loading && !error && recipes.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8">
          <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
            No community recipes found
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search keywords or active filters.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Main Recipe Cards Grid or List View */}
      {!loading && !error && filtered.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filtered.map((recipe, index) => (
            <motion.div
              key={recipe.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
            >
              <RecipeCard
                recipe={recipe}
                showBookmark={true}
                showLike={true}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

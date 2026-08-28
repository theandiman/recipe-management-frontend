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

type Tab = 'community' | 'following'

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { searchQuery, setSearchQuery } = useOmniSearch()

  const activeTab: Tab =
    user && searchParams.get('tab') === 'following' ? 'following' : 'community'

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

  // Fetch community or following recipes when tab changes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = activeTab === 'following' ? await getFeed() : await getPublicRecipes()
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
  }, [activeTab])

  const handleTabChange = (tab: Tab) => {
    if (tab === 'community') {
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ tab }, { replace: true })
    }
  }

  // Derive unique tags from current community recipe set
  const availableTags = useMemo(
    () => Array.from(new Set(recipes.flatMap(r => r.tags || []))).filter(Boolean),
    [recipes]
  )

  const activeFilterCount = getActiveFilterCount(filters)
  const hasRecipes = !loading && !error && recipes.length > 0

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header & Tabs */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Community Recipes</h1>

        {user && (
          <div className="flex border-b border-gray-200 dark:border-slate-700 mb-3">
            <button
              onClick={() => handleTabChange('community')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'community'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              Community
            </button>
            <button
              onClick={() => handleTabChange('following')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'following'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              Following
            </button>
          </div>
        )}

        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
          {hasRecipes
            ? `Showing ${filtered.length} of ${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} from the ${activeTab === 'following' ? 'cooks you follow' : 'community'}`
            : activeTab === 'following'
              ? 'Recipes from cooks you follow'
              : 'Discover recipes shared by the community'}
        </p>
      </div>

      {/* Unified Action & Filter Toolbar Bar (Aligned with My Cookbook) */}
      {hasRecipes && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {/* Left Side: Filter Trigger Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(prev => !prev)}
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

            {/* Right Side: Quick Search, Sort Select & View Mode Switcher */}
            <div className="flex items-center gap-3">
              {/* Quick Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by recipe name..."
                  className="pl-8 pr-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 w-36 sm:w-56"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="community-sort-select" className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Sort by:</label>
                <select
                  id="community-sort-select"
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
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
          </div>

          {/* Multi-Facet Filter Drawer Panel */}
          <RecipeFilterDrawer
            isOpen={isFilterDrawerOpen}
            onToggleOpen={() => setIsFilterDrawerOpen(prev => !prev)}
            filters={filters}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            availableTags={availableTags}
            hideHeaderButton
            onFiltersChange={setFilters}
            onClearFilters={clearAllFilters}
          />

          {/* Active Filter Pills Bar */}
          {(activeFilterCount > 0 || searchText) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active:</span>
              {searchText && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
                  Query: "{searchText}"
                  <button onClick={() => setSearchText('')} className="hover:text-red-500 font-bold cursor-pointer">✕</button>
                </span>
              )}
              {filters.dietaryTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
                  Tag: {tag}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, dietaryTags: prev.dietaryTags.filter(t => t !== tag) }))}
                    className="hover:text-red-500 font-bold cursor-pointer"
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
                    className="hover:text-red-500 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filters.maxCalories !== null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900">
                  Max Cal: &lt; {filters.maxCalories} kcal
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, maxCalories: null }))}
                    className="hover:text-red-500 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.1 }}
            >
              <RecipeCardSkeleton />
            </motion.div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading {activeTab === 'following' ? 'following feed' : 'community recipes'}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Empty States */}
      {!loading && !error && recipes.length === 0 && activeTab === 'community' && (
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </motion.svg>
          <motion.h3
            className="mt-4 text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            No community recipes yet
          </motion.h3>
          <motion.p
            className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            Be the first to share a recipe with the community!
          </motion.p>
        </motion.div>
      )}

      {!loading && !error && recipes.length === 0 && activeTab === 'following' && (
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </motion.svg>
          <motion.h3
            className="mt-4 text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            No recipes from followed cooks yet
          </motion.h3>
          <motion.p
            className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            Follow some cooks to see their recipes here
          </motion.p>
          <motion.button
            onClick={() => handleTabChange('community')}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            Browse Community
          </motion.button>
        </motion.div>
      )}

      {/* Recipe List / Grid Display */}
      {hasRecipes && (
        <>
          {viewMode === 'grid' ? (
            <AnimatePresence mode="wait">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {filtered.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onView={(id) => navigate(`/dashboard/recipes/${id}`)}
                    authorUid={recipe.userId}
                    showBookmark
                    showLike
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => recipe.id && navigate(`/dashboard/recipes/${recipe.id}`)}
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all shadow-xs"
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
                      {(recipe as Recipe & { likeCount?: number }).likeCount !== undefined && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          ❤️ {(recipe as Recipe & { likeCount?: number }).likeCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Smart Empty Filter State */}
          {filtered.length === 0 && (
            <motion.div
              className="mt-8 text-center py-10 px-4 bg-white dark:bg-slate-900 border border-dashed border-emerald-500/30 dark:border-emerald-500/30 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-indigo-500/5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-gray-800 dark:text-gray-200 font-bold mb-2">
                No community recipes found{searchText ? ` for "${searchText}"` : ''}.
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Clear active filters or let AI Kitchen generate a custom recipe for you in seconds.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => navigate(`/dashboard/generate?prompt=${encodeURIComponent(searchText)}`)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>✨</span> Generate {searchText ? `"${searchText}" ` : ''}with AI Kitchen
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

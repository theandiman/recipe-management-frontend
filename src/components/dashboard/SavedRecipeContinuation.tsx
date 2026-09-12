import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSavedRecipes } from '../../features/recipes/SavedRecipesContext'
import RecipeCard from '../RecipeCard'
import type { Recipe } from '../../types/nutrition'

export interface SavedRecipeContinuationProps {
  variant?: 'compact' | 'cards'
}

export const SavedRecipeContinuation: React.FC<SavedRecipeContinuationProps> = ({
  variant = 'compact',
}) => {
  const navigate = useNavigate()
  const { savedRecipes, isLoading } = useSavedRecipes()

  const formatRecipeTime = (recipe: Recipe) => {
    const time =
      recipe.totalTimeMinutes ||
      ((recipe.prepTimeMinutes || recipe.cookTimeMinutes)
        ? (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)
        : undefined) ||
      (recipe.prepTime ? parseInt(recipe.prepTime, 10) : undefined)
    return time ? `${time} min` : null
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-700 p-5 transition-colors"
      aria-labelledby="saved-recipes-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <div>
            <h2 id="saved-recipes-heading" className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
              Continue Cooking
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
              Quick access to bookmarked recipes
            </p>
          </div>
        </div>

        {savedRecipes.length > 0 && (
          <button
            onClick={() => navigate('/dashboard/saved')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            View all saved ({savedRecipes.length}) →
          </button>
        )}
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading saved recipes"
          className={variant === 'compact' ? 'space-y-2.5 animate-pulse' : 'grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 animate-pulse'}
          data-testid="saved-loading-skeleton"
        >
          <span className="sr-only">Loading saved recipes...</span>
          {[1, 2, 3].map((n) =>
            variant === 'compact' ? (
              <div key={n} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-750">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-2.5 w-1/3 rounded bg-gray-200 dark:bg-slate-700" />
                </div>
              </div>
            ) : (
              <div key={n} className="h-64 rounded-xl bg-gray-100 dark:bg-slate-700/50" />
            )
          )}
        </div>
      ) : savedRecipes.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-850/50">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </div>
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">No saved recipes yet</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
            Bookmark recipes you love to keep your cooking queue handy.
          </p>
          <button
            onClick={() => navigate('/dashboard/community')}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Explore Community Recipes</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      ) : variant === 'compact' ? (
        <ul className="divide-y divide-gray-100 dark:divide-slate-700/60" role="list">
          {savedRecipes.slice(0, 3).map((recipe, idx) => {
            const timeDisplay = formatRecipeTime(recipe)
            return (
              <li key={`saved-compact-${recipe.id || idx}`}>
                <button
                  type="button"
                  onClick={() => recipe.id && navigate(`/recipes/${recipe.id}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/30">
                        {recipe.recipeName?.[0]?.toUpperCase() || 'R'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                        {recipe.recipeName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {timeDisplay && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeDisplay}
                          </span>
                        )}
                        {recipe.servings && (
                          <span>• {recipe.servings} serv</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    Cook →
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
          {savedRecipes.slice(0, 3).map((recipe, idx) => (
            <RecipeCard
              key={`saved-${recipe.id || idx}`}
              recipe={recipe}
              onView={(id) => navigate(`/recipes/${id}`)}
              compact
              showBookmark
              showLike
              authorUid={recipe.userId}
              authorName={(recipe as { authorName?: string }).authorName}
              authorAvatarUrl={(recipe as { authorAvatarUrl?: string }).authorAvatarUrl}
            />
          ))}
        </div>
      )}
    </motion.section>
  )
}

export default SavedRecipeContinuation

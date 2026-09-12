import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSavedRecipes } from '../../features/recipes/SavedRecipesContext'
import RecipeCard from '../RecipeCard'

export const SavedRecipeContinuation: React.FC = () => {
  const navigate = useNavigate()
  const { savedRecipes, isLoading } = useSavedRecipes()

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-700 p-6 transition-colors"
      aria-labelledby="saved-recipes-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <div>
            <h2 id="saved-recipes-heading" className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Continue Cooking
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Quick access to recipes you've bookmarked to make
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse" data-testid="saved-loading-skeleton">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-xl bg-gray-100 dark:bg-slate-700/50" />
          ))}
        </div>
      ) : savedRecipes.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-850/50">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">No saved recipes yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Bookmark recipes you love from the Community or your library to keep your culinary bucket list handy.
          </p>
          <button
            onClick={() => navigate('/dashboard/community')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Explore Community Recipes</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

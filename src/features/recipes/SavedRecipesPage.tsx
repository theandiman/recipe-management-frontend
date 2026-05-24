import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import RecipeCard from '../../components/RecipeCard'
import { RecipeCardSkeleton } from '../../components/skeletons/RecipeCardSkeleton'
import { useSavedRecipes } from './SavedRecipesContext'

export const SavedRecipesPage: React.FC = () => {
  const navigate = useNavigate()
  const { savedRecipes, isLoading, reload } = useSavedRecipes()

  useEffect(() => {
    reload()
  }, [reload])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Saved Recipes</h1>
          <p className="text-gray-600 dark:text-gray-300">Your bookmarked recipe collection</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
            >
              <RecipeCardSkeleton />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (savedRecipes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Saved Recipes</h1>
          <p className="text-gray-600 dark:text-gray-300">Your bookmarked recipe collection</p>
        </div>
        <div
          data-testid="empty-state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10 text-emerald-400"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No saved recipes yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            Save recipes you love by clicking the bookmark icon on any recipe card or detail page.
          </p>
          <button
            onClick={() => navigate('/dashboard/recipes')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
          >
            Browse Recipes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Saved Recipes</h1>
        <p className="text-gray-600 dark:text-gray-300">
          {savedRecipes.length} {savedRecipes.length === 1 ? 'recipe' : 'recipes'} saved
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {savedRecipes.map((recipe, index) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
          >
            <RecipeCard
              recipe={recipe}
              onView={(id) => navigate(`/dashboard/recipes/${id}`)}
              showBookmark
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

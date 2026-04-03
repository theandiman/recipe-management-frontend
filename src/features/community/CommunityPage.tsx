import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getPublicRecipes } from '../../services/recipeStorageApi'
import RecipeCard from '../../components/RecipeCard'
import { RecipeCardSkeleton } from '../../components/skeletons/RecipeCardSkeleton'
import type { Recipe } from '../../types/nutrition'

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPublicRecipes = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getPublicRecipes()
        setRecipes(data)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load community recipes'
        const apiError = err as { response?: { data?: { message?: string } } }
        setError(apiError.response?.data?.message || errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchPublicRecipes()
  }, [])

  const filtered = React.useMemo(() => {
    const text = searchText.trim().toLowerCase()
    if (!text) return recipes
    return recipes.filter(r =>
      (r.recipeName || '').toLowerCase().includes(text)
    )
  }, [recipes, searchText])

  const hasRecipes = !loading && !error && recipes.length > 0

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Community Recipes</h1>
        <p className="text-sm md:text-base text-gray-600">
          {hasRecipes
            ? `Showing ${filtered.length} of ${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} from the community`
            : 'Discover recipes shared by the community'}
        </p>
        {hasRecipes && (
          <div className="mt-4">
            <label htmlFor="community-search" className="sr-only">Search community recipes</label>
            <input
              id="community-search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by recipe name..."
              className="w-full sm:max-w-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
        )}
      </div>

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

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading community recipes</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && recipes.length === 0 && (
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
            className="mt-4 text-base sm:text-lg font-medium text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            No community recipes yet
          </motion.h3>
          <motion.p
            className="mt-2 text-sm sm:text-base text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            Be the first to share a recipe with the community!
          </motion.p>
        </motion.div>
      )}

      {hasRecipes && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onView={(id) => navigate(`/dashboard/recipes/${id}`)}
            />
          ))}
        </motion.div>
      )}

      {hasRecipes && filtered.length === 0 && (
        <div className="mt-6 text-center text-gray-600">No recipes match your search.</div>
      )}
    </div>
  )
}

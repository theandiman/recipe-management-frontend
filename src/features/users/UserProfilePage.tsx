import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getUserProfile } from '../../services/userApi'
import RecipeCard from '../../components/RecipeCard'
import { RecipeCardSkeleton } from '../../components/skeletons/RecipeCardSkeleton'
import type { UserProfile } from '../../services/userApi'

export const UserProfilePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!uid) return
      try {
        setLoading(true)
        setNotFound(false)
        setError(null)
        const data = await getUserProfile(uid)
        setProfile(data)
      } catch (err: unknown) {
        const apiError = err as { response?: { status?: number; data?: { message?: string } } }
        if (apiError.response?.status === 404) {
          setNotFound(true)
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load profile'
          setError(apiError.response?.data?.message || errorMessage)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [uid])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div
            data-testid="loading-spinner"
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"
          />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
        <div className="text-center py-16">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">User not found</h2>
          <p className="text-gray-500">The profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading profile</p>
          <p className="text-sm mt-1">{error || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  const avatarLetter = (profile.displayName || profile.uid)?.[0]?.toUpperCase() || '?'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Go Back
      </button>

      {/* Profile header */}
      <motion.div
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {avatarLetter}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {profile.displayName}
            </h1>
            {profile.bio && (
              <p className="text-gray-600 mb-3">{profile.bio}</p>
            )}
            <p className="text-sm text-gray-500 mb-4">
              {profile.publicRecipeCount}{' '}
              {profile.publicRecipeCount === 1 ? 'public recipe' : 'public recipes'}
            </p>

            {/* Follow button – placeholder for M3 */}
            {/* TODO(M3): wire up follow/unfollow API */}
            <button
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onClick={() => { /* TODO(M3): implement follow */ }}
            >
              Follow
            </button>
          </div>
        </div>
      </motion.div>

      {/* Public recipes grid */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Public Recipes</h2>

      {profile.publicRecipes.length === 0 ? (
        <motion.div
          className="text-center py-12 text-gray-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          No public recipes yet.
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {profile.publicRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
            >
              <RecipeCard
                recipe={recipe}
                onView={(id) => navigate(`/dashboard/recipes/${id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export const UserProfilePageSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8 animate-pulse">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-7 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-64" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-9 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  </div>
)

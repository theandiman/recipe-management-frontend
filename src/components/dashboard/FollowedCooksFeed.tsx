import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useFeed } from '../../services/recipeApi'
import RecipeCard from '../RecipeCard'
import { UserAvatar } from '../UserAvatar'

export const FollowedCooksFeed: React.FC = () => {
  const navigate = useNavigate()
  const { recipes, loading, error, refetch: fetchFeed } = useFeed()

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-700 p-6 transition-colors"
      aria-labelledby="followed-cooks-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h2 id="followed-cooks-heading" className="text-lg font-bold text-gray-900 dark:text-gray-100">
              From cooks you follow
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Fresh recipes from the culinary creators in your network
            </p>
          </div>
        </div>

        {recipes.length > 0 && (
          <button
            onClick={() => navigate('/dashboard/community?following=true')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
          >
            View all in Community →
          </button>
        )}
      </div>

      {loading ? (
        <div
          role="status"
          aria-label="Loading followed cooks recipes"
          className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 animate-pulse"
          data-testid="feed-loading-skeleton"
        >
          <span className="sr-only">Loading followed cooks recipes...</span>
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-xl bg-gray-100 dark:bg-slate-700/50" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>Failed to load followed cooks: {error}</span>
          <button
            onClick={fetchFeed}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-850/50">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">No followed-cook recipes yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Follow chefs and home cooks in the community to get their newest culinary creations delivered right here.
          </p>
          <button
            onClick={() => navigate('/dashboard/community')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Discover Cooks & Recipes</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
          {recipes.slice(0, 3).map((recipe, idx) => {
            const authorName =
              (recipe as { authorDisplayName?: string }).authorDisplayName ||
              (recipe as { authorName?: string }).authorName ||
              (recipe as { displayName?: string }).displayName ||
              (recipe.userId ? `Chef ${recipe.userId.slice(0, 5)}` : 'Chef')
            const authorAvatar =
              (recipe as { authorAvatarUrl?: string }).authorAvatarUrl ||
              (recipe as { avatarUrl?: string }).avatarUrl
            return (
              <div key={`followed-${recipe.id || idx}`} className="flex flex-col gap-1.5">
                {recipe.userId && (
                  <div className="flex items-center gap-2 px-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/user/${recipe.userId}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <UserAvatar src={authorAvatar} name={authorName} size="xs" />
                      <span className="truncate">{authorName}</span>
                    </button>
                  </div>
                )}
                <RecipeCard
                  recipe={recipe}
                  onView={(id) => navigate(`/recipes/${id}`)}
                  compact
                  showBookmark
                  showLike
                  authorUid={recipe.userId}
                  authorName={authorName}
                  authorAvatarUrl={authorAvatar}
                />
              </div>
            )
          })}
        </div>
      )}
    </motion.section>
  )
}

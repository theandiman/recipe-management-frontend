import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Recipe } from '../types/nutrition'
import GlobeIcon from './GlobeIcon'

interface RecipeCardProps {
  recipe: Recipe
  onView?: (id: string) => void
  onDelete?: (recipe: Recipe) => void
  compact?: boolean
  authorUid?: string
  authorName?: string
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onView, onDelete, compact, authorUid, authorName }) => {
  const title = recipe.recipeName
  // Calculate total time safely
  const totalTime = recipe.totalTimeMinutes ||
    ((recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)) ||
    // Fallback to parsing strings if numbers are missing (though shared type suggests they might be optional)
    // For now, let's just display what we have or skip
    undefined

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (recipe.id) onView?.(recipe.id)
        }
      }}
      onClick={() => { if (recipe.id) onView?.(recipe.id) }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${compact ? 'p-0' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {recipe.isPublic && (
        <div
          data-testid="public-badge"
          className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full pointer-events-none"
        >
          <GlobeIcon className="w-3 h-3" />
          Public
        </div>
      )}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(recipe) }}
          className="absolute top-3 right-3 z-10 bg-red-500 text-white p-2.5 md:p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
          title={`Delete ${title}`}
          aria-label={`Delete ${title}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
      <div className="h-full">
        {recipe.imageUrl ? (
          <motion.div className="relative h-40 sm:h-48 overflow-hidden" whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                <img src={recipe.imageUrl} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
            {/* Title overlay at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-3">
              <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2">{title}</h3>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM3 5h8v14H3z" />
                </svg>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className={`p-3 sm:p-4 ${compact ? 'p-2 sm:p-3' : ''}`}>
          {!recipe.imageUrl && <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h3>}
          {recipe.description && <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {(totalTime !== undefined && totalTime > 0) ? (
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {totalTime} min
              </span>
            ) : (recipe.prepTime || recipe.cookTime) ? (
               <span className="flex items-center">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                 {recipe.prepTime} {recipe.cookTime}
              </span>
            ) : null}
            <span className="flex items-center">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {recipe.servings} servings
            </span>
          </div>
        </div>
      </div>
      {authorUid && (
        <div className="px-3 sm:px-4 pb-3 border-t border-gray-100 pt-2">
          <Link
            to={`/user/${authorUid}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
              }
            }}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            aria-label={authorName ? `View ${authorName}'s profile` : 'View author profile'}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {((authorName || authorUid)[0] || '?').toUpperCase()}
            </div>
            <span className="truncate">{authorName || 'View Author'}</span>
          </Link>
        </div>
      )}
    </motion.div>
  )
}

export default RecipeCard

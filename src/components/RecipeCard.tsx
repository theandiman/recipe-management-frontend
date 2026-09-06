import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Recipe } from '../types/nutrition'
import GlobeIcon from './GlobeIcon'
import BookmarkButton from './BookmarkButton'
import LikeButton from './LikeButton'

interface RecipeCardProps {
  recipe: Recipe
  onView?: (id: string) => void
  onDelete?: (recipe: Recipe) => void
  compact?: boolean
  authorUid?: string
  authorName?: string
  showBookmark?: boolean
  showLike?: boolean
  matchReason?: string
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onView, onDelete, compact, authorUid, authorName, showBookmark = false, showLike = false, matchReason }) => {
  const navigate = useNavigate()
  const [isFlipped, setIsFlipped] = useState(false)
  const title = recipe.recipeName
  
  const totalTime = recipe.totalTimeMinutes ||
    ((recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)) ||
    undefined

  const handleCardClick = () => {
    if (!recipe.id) return
    if (onView) {
      onView(recipe.id)
    } else {
      navigate(`/recipes/${recipe.id}`)
    }
  }

  // Determine author display name
  const recipeWithAuthor = recipe as Recipe & { authorName?: string; displayName?: string; averageRating?: number; ratingCount?: number }
  const displayAuthorName = authorName || recipeWithAuthor.authorName || recipeWithAuthor.displayName

  return (
    <div className="group [perspective:1000px] w-full h-full">
      <motion.div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
        onClick={handleCardClick}
        onHoverStart={() => setIsFlipped(true)}
        onHoverEnd={() => setIsFlipped(false)}
        onFocus={() => setIsFlipped(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFlipped(false)
          }
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`relative w-full h-full rounded-2xl shadow-sm hover:shadow-xl [transform-style:preserve-3d] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${compact ? 'p-0' : ''}`}
      >
        {/* --- FRONT FACE --- */}
        <div 
          className="relative w-full h-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden [backface-visibility:hidden] [-webkit-backface-visibility:hidden] flex flex-col"
          inert={isFlipped ? true : undefined}
        >
          {recipe.isPublic && (
            <div data-testid="public-badge" className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full pointer-events-none">
              <GlobeIcon className="w-3 h-3" />
              Public
            </div>
          )}
          
          {showBookmark && (
            <div className={`absolute top-3 ${onDelete ? 'right-14' : 'right-3'} z-10`} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <BookmarkButton recipe={recipe} className="bg-white/90 shadow-sm hover:bg-white" />
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

          {recipe.imageUrl ? (
            <div className="relative h-48 sm:h-56 overflow-hidden flex-shrink-0">
              <img 
                src={recipe.imageUrl} 
                alt="" 
                aria-hidden="true" 
                loading="lazy" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className={`p-4 sm:p-5 flex-grow flex flex-col justify-between ${compact ? 'p-3 sm:p-4' : ''}`}>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{title}</h3>
              {matchReason && (
                <div className="mb-3 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <span className="flex-shrink-0">✨</span>
                  <span className="truncate">{matchReason}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
              {(totalTime !== undefined && totalTime > 0) ? (
                <span className="flex items-center bg-gray-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {totalTime} min
                </span>
              ) : (recipe.prepTime || recipe.cookTime) ? (
                 <span className="flex items-center bg-gray-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                   {recipe.prepTime} {recipe.cookTime}
                </span>
              ) : null}
              <span className="flex items-center bg-gray-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {recipe.servings} servings
              </span>
              {recipeWithAuthor.averageRating !== undefined && recipeWithAuthor.averageRating > 0 && (
                <span className="flex items-center bg-amber-500/10 text-amber-500 font-semibold px-2 py-1 rounded-md">
                  ⭐ {recipeWithAuthor.averageRating.toFixed(1)} {recipeWithAuthor.ratingCount ? `(${recipeWithAuthor.ratingCount})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div 
          className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden flex flex-col shadow-inner"
          inert={!isFlipped ? true : undefined}
        >
          {/* Top header for back face */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 border-b border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between flex-shrink-0">
             <h4 className="font-bold text-emerald-800 dark:text-emerald-400 line-clamp-1">Recipe Details</h4>
             <div className="flex items-center gap-2">
               {showBookmark && (
                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <BookmarkButton recipe={recipe} className="bg-white/90 shadow-sm hover:bg-white" />
                  </div>
                )}
             </div>
          </div>

          <div className="p-4 sm:p-5 flex-grow overflow-y-auto">
            {recipe.description ? (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{recipe.description}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p>No description provided.</p>
              </div>
            )}
          </div>
          
          {(authorUid || showLike) && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700/50 mt-auto flex items-center justify-between gap-2 flex-shrink-0">
              {authorUid ? (
                <Link
                  to={`/user/${authorUid}`}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-w-0"
                  aria-label={displayAuthorName ? `View ${displayAuthorName}'s profile` : 'View author profile'}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-inner">
                    {(displayAuthorName ? displayAuthorName[0] : 'C').toUpperCase()}
                  </div>
                  <span className="truncate font-medium">{displayAuthorName || 'View Author'}</span>
                </Link>
              ) : <div />}
              
              {showLike && (
                <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                  <LikeButton
                    recipe={recipe}
                    className="bg-white/90 dark:bg-slate-700/80 shadow-sm hover:bg-white dark:hover:bg-slate-700"
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Mobile Tap Hint */}
          <div className="md:hidden absolute bottom-3 right-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded shadow-sm pointer-events-none">
            Tap to view
          </div>
        </div>

      </motion.div>
    </div>
  )
}

export default RecipeCard

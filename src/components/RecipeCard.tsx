import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { Recipe } from '../types/nutrition'
import GlobeIcon from './GlobeIcon'
import BookmarkButton from './BookmarkButton'
import LikeButton from './LikeButton'

interface RecipeCardProps {
  recipe: Recipe
  onView?: (id: string) => void
  onDelete?: (recipe: Recipe) => void
  onEdit?: (recipe: Recipe) => void
  isOwner?: boolean
  compact?: boolean
  authorUid?: string
  authorName?: string
  showBookmark?: boolean
  showLike?: boolean
  showMenu?: boolean
  matchReason?: string
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onView,
  onDelete,
  onEdit,
  isOwner,
  compact,
  authorUid,
  authorName,
  showBookmark = false,
  showLike = false,
  showMenu,
  matchReason,
}) => {
  const navigate = useNavigate()
  const [isFlipped, setIsFlipped] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const title = recipe.recipeName
  const canEdit = Boolean(onEdit || isOwner || (recipe.id && onDelete))
  const canDelete = Boolean(onDelete)
  const hasMenuActions = Boolean(canEdit || canDelete || recipe.id)
  const shouldShowMenu = showMenu !== undefined ? showMenu : hasMenuActions

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isMenuOpen])

  const totalTime = recipe.totalTimeMinutes ||
    ((recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)) ||
    undefined

  const handleCardClick = () => {
    if (!recipe.id || isMenuOpen) return
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
        onHoverStart={() => {
          if (!isMenuOpen) setIsFlipped(true)
        }}
        onHoverEnd={() => {
          if (!isMenuOpen) setIsFlipped(false)
        }}
        onFocus={() => {
          if (!isMenuOpen) setIsFlipped(true)
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFlipped(false)
          }
        }}
        animate={{ rotateY: (isFlipped && !isMenuOpen) ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`relative w-full h-full rounded-2xl shadow-sm hover:shadow-xl [transform-style:preserve-3d] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${compact ? 'p-0' : ''}`}
      >
        {/* --- FRONT FACE --- */}
        <div 
          className="relative w-full h-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden [backface-visibility:hidden] [-webkit-backface-visibility:hidden] flex flex-col"
          inert={(isFlipped && !isMenuOpen) ? true : undefined}
        >
          {recipe.isPublic && (
            <div data-testid="public-badge" className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full pointer-events-none">
              <GlobeIcon className="w-3 h-3" />
              Public
            </div>
          )}

          {/* Top-Right Action Cluster (Bookmark + 3-Dots Menu) */}
          <div
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsMenuOpen(false)
              }
              e.stopPropagation()
            }}
          >
            {showBookmark && (
              <BookmarkButton
                recipe={recipe}
                className="bg-white/90 dark:bg-slate-800/90 shadow-sm hover:bg-white dark:hover:bg-slate-800"
              />
            )}

            {shouldShowMenu && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  data-testid="recipe-card-menu-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMenuOpen((prev) => !prev)
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                  }}
                  aria-label={`More options for ${title}`}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  title={`More options for ${title}`}
                  className="flex items-center justify-center p-2 rounded-full bg-white/90 dark:bg-slate-800/90 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div
                    role="menu"
                    aria-label={`Options for ${title}`}
                    className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-white dark:bg-slate-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10 border border-gray-200 dark:border-slate-700 py-1 z-30 overflow-hidden animate-[fadeIn_0.1s_ease]"
                  >
                    {canEdit && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsMenuOpen(false)
                          if (onEdit) {
                            onEdit(recipe)
                          } else if (recipe.id) {
                            navigate(`/dashboard/recipes/edit/${recipe.id}`)
                          }
                        }}
                        aria-label={`Edit ${title}`}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit recipe
                      </button>
                    )}

                    {recipe.id && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async (e) => {
                          e.stopPropagation()
                          setIsMenuOpen(false)
                          try {
                            const url = `${window.location.origin}/recipes/${recipe.id}`
                            if (navigator.clipboard?.writeText) {
                              await navigator.clipboard.writeText(url)
                            }
                            toast.success('Recipe link copied to clipboard!')
                          } catch {
                            toast.error('Failed to copy link')
                          }
                        }}
                        aria-label={`Copy link for ${title}`}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Copy link
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsMenuOpen(false)
                          onDelete?.(recipe)
                        }}
                        aria-label={`Delete ${title}`}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left border-t border-gray-100 dark:border-slate-700/60 cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete recipe
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
              {showLike && (
                <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="ml-auto flex-shrink-0">
                  <LikeButton
                    recipe={recipe}
                    className="bg-gray-100 dark:bg-slate-700/50 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  />
                </div>
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

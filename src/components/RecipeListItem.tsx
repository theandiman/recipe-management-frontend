import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Recipe } from '../types/nutrition'
import BookmarkButton from './BookmarkButton'
import LikeButton from './LikeButton'
import { UserAvatar } from './UserAvatar'
import GlobeIcon from './GlobeIcon'

export interface RecipeListItemProps {
  recipe: Recipe
  onView?: (id: string) => void
  onDelete?: (recipe: Recipe) => void
  onEdit?: (recipe: Recipe) => void
  isOwner?: boolean
  authorUid?: string
  authorName?: string
  authorAvatarUrl?: string
  showBookmark?: boolean
  showLike?: boolean
  className?: string
  matchReason?: string
}

export const RecipeListItem: React.FC<RecipeListItemProps> = ({
  recipe,
  onView,
  onDelete,
  onEdit,
  isOwner,
  authorUid: propAuthorUid,
  authorName: propAuthorName,
  authorAvatarUrl: propAuthorAvatarUrl,
  showBookmark = false,
  showLike = false,
  className = '',
  matchReason,
}) => {
  const navigate = useNavigate()

  const recipeWithAuthor = recipe as Recipe & {
    authorUid?: string
    authorDisplayName?: string
    authorName?: string
    displayName?: string
    author?: string
    authorAvatarUrl?: string
    avatarUrl?: string
    photoUrl?: string
    averageRating?: number
    ratingCount?: number
  }

  const resolvedAuthorUid = propAuthorUid || recipeWithAuthor.authorUid || recipe.userId
  const resolvedAuthorName =
    propAuthorName ||
    recipeWithAuthor.authorDisplayName ||
    recipeWithAuthor.authorName ||
    recipeWithAuthor.displayName ||
    recipeWithAuthor.author ||
    (resolvedAuthorUid ? `Chef ${resolvedAuthorUid.slice(0, 5)}` : undefined)
  const resolvedAuthorAvatarUrl = propAuthorAvatarUrl || recipeWithAuthor.authorAvatarUrl || recipeWithAuthor.avatarUrl || recipeWithAuthor.photoUrl

  const canDelete = Boolean(onDelete && (isOwner || !recipe.userId))
  const canEdit = Boolean(onEdit && (isOwner || !recipe.userId))

  const totalTime =
    recipe.totalTimeMinutes ||
    ((recipe.prepTimeMinutes || recipe.cookTimeMinutes)
      ? (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)
      : undefined)

  const handleRowClick = () => {
    if (!recipe.id) return
    if (onView) {
      onView(recipe.id)
    } else {
      navigate(`/recipes/${recipe.id}`)
    }
  }

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-800 rounded-2xl hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500 ${className}`}
    >
      {/* Left: Thumbnail & Core Info */}
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 shadow-2xs"
          />
        ) : (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {recipe.recipeName?.[0]?.toUpperCase() || 'R'}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Author info (when available) */}
          {resolvedAuthorName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              <UserAvatar
                src={resolvedAuthorAvatarUrl}
                name={resolvedAuthorName}
                size="xs"
                className="w-4 h-4 text-[9px]"
              />
              {resolvedAuthorUid ? (
                <Link
                  to={`/user/${resolvedAuthorUid}`}
                  className="relative z-10 font-medium hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 truncate max-w-[130px]"
                >
                  {resolvedAuthorName}
                </Link>
              ) : (
                <span className="font-medium truncate max-w-[130px]">{resolvedAuthorName}</span>
              )}
              {recipe.isPublic && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-sm">
                    <GlobeIcon className="w-2.5 h-2.5" /> Public
                  </span>
                </>
              )}
            </div>
          )}

          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
            <button
              type="button"
              onClick={handleRowClick}
              className="text-left focus:outline-none after:absolute after:inset-0 cursor-pointer"
            >
              {recipe.recipeName}
            </button>
          </h3>

          {matchReason ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate mt-0.5 font-medium flex items-center gap-1">
              <span>✨</span>
              <span className="truncate">{matchReason}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {recipe.description || 'No description provided.'}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mt-1.5">
            {(recipe.tags || []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-[10px] rounded-md font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Meta stats & Action buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
          {totalTime ? (
            <span className="flex items-center">
              <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {totalTime} min
            </span>
          ) : recipe.prepTime ? (
            <span className="flex items-center">
              <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.prepTime} min
            </span>
          ) : null}

          {recipe.servings && (
            <span className="hidden sm:flex items-center">
              <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {recipe.servings}
            </span>
          )}

          {recipeWithAuthor.averageRating !== undefined && recipeWithAuthor.averageRating > 0 && (
            <span className="flex items-center text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md">
              ⭐ {recipeWithAuthor.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="relative z-10 flex items-center gap-2">
          {showLike && (
            <LikeButton
              recipe={recipe}
              className="bg-gray-50 dark:bg-slate-800 shadow-2xs hover:bg-gray-100 dark:hover:bg-slate-700"
            />
          )}

          {showBookmark && (
            <BookmarkButton
              recipe={recipe}
              className="bg-gray-50 dark:bg-slate-800 shadow-2xs hover:bg-gray-100 dark:hover:bg-slate-700"
            />
          )}

          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(recipe)
              }}
              aria-label={`Edit ${recipe.recipeName}`}
              title="Edit recipe"
              className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(recipe)
              }}
              aria-label={`Delete ${recipe.recipeName}`}
              title="Delete recipe"
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Right chevron indicator */}
          <div className="hidden sm:block text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipeListItem

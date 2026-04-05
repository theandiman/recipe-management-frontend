import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { useLikeContext } from '../features/recipes/LikeContext'
import type { Recipe } from '../types/nutrition'

interface LikeButtonProps {
  recipe: Recipe
  className?: string
}

export const LikeButton: React.FC<LikeButtonProps> = ({ recipe, className = '' }) => {
  const { isAuthenticated } = useAuth()
  const { getLikeState, initRecipe, toggleLike } = useLikeContext()
  const navigate = useNavigate()

  const id = recipe.id ?? ''
  // Read optional like fields that the API may return at runtime
  const recipeWithLike = recipe as Recipe & { likeCount?: number; isLikedByCurrentUser?: boolean }
  const serverLikeCount = recipeWithLike.likeCount ?? 0
  const serverIsLiked = recipeWithLike.isLikedByCurrentUser ?? false

  // Seed context from recipe data
  useEffect(() => {
    if (id) {
      initRecipe(id, serverIsLiked, serverLikeCount)
    }
  }, [id, serverIsLiked, serverLikeCount, initRecipe])

  const state = id ? getLikeState(id) : undefined
  const isLiked = state?.isLiked ?? serverIsLiked
  const likeCount = state?.likeCount ?? serverLikeCount

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!id) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    await toggleLike(id, { isLiked: serverIsLiked, likeCount: serverLikeCount })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isLiked ? `Unlike ${recipe.recipeName}` : `Like ${recipe.recipeName}`}
      aria-pressed={isLiked}
      title={isLiked ? 'Unlike recipe' : 'Like recipe'}
      className={`flex items-center gap-1 rounded-full px-2 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 ${
        isLiked
          ? 'text-rose-500 hover:text-rose-600'
          : 'text-gray-400 hover:text-rose-500'
      } ${className}`}
    >
      {isLiked ? (
        // Filled heart
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        // Outline heart
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      )}
      <span className="text-xs font-medium tabular-nums">{likeCount}</span>
    </button>
  )
}

export default LikeButton

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../features/auth/AuthContext'
import { useSavedRecipes } from '../features/recipes/SavedRecipesContext'
import type { Recipe } from '../types/nutrition'

interface BookmarkButtonProps {
  recipe: Recipe
  className?: string
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({ recipe, className = '' }) => {
  const { isAuthenticated } = useAuth()
  const { isSaved, toggleSave } = useSavedRecipes()
  const navigate = useNavigate()

  const saved = recipe.id ? isSaved(recipe.id) : false

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if ('vibrate' in navigator) {
      try { navigator.vibrate(10) } catch {}
    }

    await toggleSave(recipe)
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
      aria-label={saved ? `Unsave ${recipe.recipeName}` : `Save ${recipe.recipeName}`}
      aria-pressed={saved}
      title={saved ? 'Remove from saved' : 'Save recipe'}
      className={`flex items-center justify-center rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
        saved
          ? 'text-emerald-600 hover:text-emerald-700'
          : 'text-gray-400 hover:text-emerald-600'
      } ${className}`}
    >
      {saved ? (
        // Filled bookmark
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" />
        </svg>
      ) : (
        // Outline bookmark
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
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      )}
    </motion.button>
  )
}

export default BookmarkButton

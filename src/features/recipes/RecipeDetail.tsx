import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRecipe, updateRecipeSharing } from '../../services/recipeStorageApi'
import { CookingMode } from '../../components/CookingMode'
import GlobeIcon from '../../components/GlobeIcon'
import BookmarkButton from '../../components/BookmarkButton'
import LikeButton from '../../components/LikeButton'
import type { Recipe } from '../../types/nutrition'
import RecipeBody from './components/RecipeBody'
import { useAuth } from '../../features/auth/AuthContext'

// ── Icon helpers ────────────────────────────────────────────────────────────
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)
const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

export const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCookingMode, setIsCookingMode] = useState(false)
  const [isTogglingShare, setIsTogglingShare] = useState(false)
  const [sharingError, setSharingError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOwner = !!currentUser && !!recipe?.userId && currentUser.uid === recipe.userId

  useEffect(() => {
    if (!sharingError) return
    const timer = setTimeout(() => setSharingError(null), 5000)
    return () => clearTimeout(timer)
  }, [sharingError])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await getRecipe(id)
        setRecipe(data)
      } catch (err: unknown) {
        console.error('Failed to fetch recipe:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recipe'
        const apiError = err as { response?: { data?: { message?: string } } }
        setError(apiError.response?.data?.message || errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipe()
  }, [id])

  const handleCopyLink = async () => {
    if (!id) return
    const url = `${window.location.origin}/recipes/${id}`
    const showFallback = () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
        copyTimerRef.current = null
      }
      setIsCopied(false)
      setFallbackUrl(url)
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setFallbackUrl(null)
        setIsCopied(true)
        if (copyTimerRef.current) {
          clearTimeout(copyTimerRef.current)
          copyTimerRef.current = null
        }
        copyTimerRef.current = setTimeout(() => setIsCopied(false), 2000)
      } catch {
        showFallback()
      }
    } else {
      showFallback()
    }
  }

  const handleToggleSharing = async () => {
    if (!id || !recipe) return
    
    try {
      setIsTogglingShare(true)
      setSharingError(null)
      const newIsPublic = !recipe.isPublic
      const updatedRecipe = await updateRecipeSharing(id, newIsPublic)
      setRecipe(updatedRecipe)
    } catch (err) {
      console.error('Failed to update recipe sharing:', err)
      setSharingError('Could not update sharing status. Please try again.')
    } finally {
      setIsTogglingShare(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/recipes')}
          className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading recipe</p>
          <p className="text-sm mt-1">{error || 'Recipe not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header: back nav + action toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/dashboard/recipes')}
          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 font-medium transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Action toolbar */}
        <div className="flex items-center gap-1.5">
          {/* Like & Bookmark — always-visible icon buttons */}
          {recipe && (
            <LikeButton recipe={recipe} />
          )}
          {recipe && (
            <BookmarkButton recipe={recipe} />
          )}

          {/* More options dropdown (owner actions + copy link) */}
          {(isOwner || recipe.isPublic) && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                id="recipe-options-button"
                onClick={() => !isTogglingShare && setIsMenuOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-controls="recipe-options-menu"
                aria-label={isTogglingShare ? 'Updating…' : 'More options'}
                title="More options"
                disabled={isTogglingShare}
                className="flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isTogglingShare ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                  </svg>
                )}
              </button>

              {isMenuOpen && (
                <div
                  id="recipe-options-menu"
                  role="menu"
                  aria-labelledby="recipe-options-button"
                  className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10 py-1 z-20 animate-[fadeIn_0.1s_ease]"
                >
                  {isOwner && (
                    <button
                      role="menuitem"
                      onClick={() => { setIsMenuOpen(false); navigate(`/dashboard/recipes/edit/${id}`) }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <EditIcon />
                      Edit recipe
                    </button>
                  )}

                  {isOwner && (
                    <button
                      role="menuitem"
                      onClick={() => { setIsMenuOpen(false); handleToggleSharing() }}
                      disabled={isTogglingShare}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isTogglingShare ? (
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      ) : recipe.isPublic ? (
                        <LockIcon />
                      ) : (
                        <GlobeIcon className="w-4 h-4" />
                      )}
                      {recipe.isPublic ? 'Make private' : 'Share publicly'}
                    </button>
                  )}

                  {recipe.isPublic && (
                    <button
                      role="menuitem"
                      onClick={() => { handleCopyLink() }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {isCopied ? <CheckIcon /> : <LinkIcon />}
                      {isCopied ? 'Copied!' : 'Copy link'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Primary CTA */}
          <button
            onClick={() => setIsCookingMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Cook
          </button>
        </div>
      </div>

      {/* Inline sharing error */}
      {sharingError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{sharingError}</span>
          </div>
          <button
            onClick={() => setSharingError(null)}
            aria-label="Dismiss error"
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Recipe title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{recipe.recipeName}</h1>

      {/* Author link */}
      {recipe.userId ? (
        <Link
          to={`/user/${recipe.userId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors mb-6"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
            {(recipe.userId[0] || '?').toUpperCase()}
          </div>
          <span>View author profile</span>
        </Link>
      ) : (
        <div className="mb-4" />
      )}

      {/* Recipe image */}
      {recipe.imageUrl && (
        <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
          <img
            src={recipe.imageUrl}
            alt={recipe.recipeName}
            loading="lazy"
            className="w-full h-96 object-cover"
          />
        </div>
      )}

      {/* Recipe details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <RecipeBody recipe={recipe} />
      </div>

      {/* Cooking Mode Modal */}
      {isCookingMode && recipe && (
        <CookingMode recipe={recipe} onClose={() => setIsCookingMode(false)} />
      )}

      {/* Clipboard fallback notification */}
      {fallbackUrl && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-emerald-600 rounded-lg shadow-lg px-6 py-4 flex items-start gap-4 max-w-sm w-full"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">Copy this link manually:</p>
            <p className="text-sm text-gray-600 break-all">{fallbackUrl}</p>
          </div>
          <button
            onClick={() => setFallbackUrl(null)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

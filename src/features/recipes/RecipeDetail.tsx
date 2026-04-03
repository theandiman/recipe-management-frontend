import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRecipe, updateRecipeSharing } from '../../services/recipeStorageApi'
import { CookingMode } from '../../components/CookingMode'
import GlobeIcon from '../../components/GlobeIcon'
import type { Recipe } from '../../types/nutrition'

export const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCookingMode, setIsCookingMode] = useState(false)
  const [isTogglingShare, setIsTogglingShare] = useState(false)
  const [sharingError, setSharingError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const url = `${window.location.origin}/dashboard/recipes/${id}`
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
          className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Library
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
      {/* Header with back button and action buttons */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/recipes')}
          className="text-emerald-600 hover:text-emerald-700 flex items-center font-medium transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Library
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/dashboard/recipes/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Recipe
          </button>
          
          <button
            onClick={handleToggleSharing}
            disabled={isTogglingShare}
            className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={recipe.isPublic ? 'Make recipe private' : 'Share recipe publicly'}
          >
            {isTogglingShare ? (
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : recipe.isPublic ? (
              <GlobeIcon className="w-5 h-5" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
            {recipe.isPublic ? 'Make Private' : 'Share'}
          </button>

          {recipe.isPublic && (
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
            >
              {isCopied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setIsCookingMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Cooking Mode
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
        {recipe.description && (
          <p className="text-lg text-gray-600 mb-6">{recipe.description}</p>
        )}

        {/* Recipe meta */}
        <div className="flex flex-wrap gap-6 pb-6 border-b border-gray-200">
          {(recipe.prepTimeMinutes || recipe.prepTime) && (
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm text-gray-500">Prep Time</div>
                <div className="font-medium">{recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : recipe.prepTime}</div>
              </div>
            </div>
          )}
          
          {(recipe.cookTimeMinutes || recipe.cookTime) && (
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <div>
                <div className="text-sm text-gray-500">Cook Time</div>
                <div className="font-medium">{recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min` : recipe.cookTime}</div>
              </div>
            </div>
          )}

          {recipe.servings && (
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div>
                <div className="text-sm text-gray-500">Servings</div>
                <div className="font-medium">{recipe.servings}</div>
              </div>
            </div>
          )}
        </div>

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient: string, index: number) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm mr-4 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 pt-1">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
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

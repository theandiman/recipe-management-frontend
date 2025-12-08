import { useState } from 'react'
import { updateRecipeSharing } from '../services/recipeStorageApi'

interface RecipeSharingToggleProps {
  recipeId: string
  initialIsPublic: boolean
  onToggle?: (isPublic: boolean) => void
}

export const RecipeSharingToggle: React.FC<RecipeSharingToggleProps> = ({
  recipeId,
  initialIsPublic,
  onToggle
}) => {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    const newValue = !isPublic
    setLoading(true)
    setError(null)

    try {
      await updateRecipeSharing(recipeId, newValue)
      setIsPublic(newValue)
      onToggle?.(newValue)
    } catch (err) {
      console.error('Share toggle error:', err)
      const apiError = err as { response?: { data?: { message?: string; errors?: any } } }
      const errorMsg = apiError.response?.data?.message ||
                       'Failed to update sharing status'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        title={isPublic ? 'Unshare recipe (make private)' : 'Share recipe with community'}
        aria-label={isPublic ? 'Make recipe private' : 'Make recipe public'}
        className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          isPublic 
            ? 'text-emerald-600 hover:bg-emerald-50' 
            : 'text-gray-400 hover:bg-gray-50'
        }`}
      >
        {isPublic ? (
          // Shared icon (filled)
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
        ) : (
          // Unshared icon (outline)
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
      </button>
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}

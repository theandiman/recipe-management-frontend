import React, { useState } from 'react'
import { saveRating } from '../../../services/ratingApi'

interface RecipeRatingFormProps {
  recipeId: string
  onRatingSubmitted?: () => void
}

const StarIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)

export const RecipeRatingForm: React.FC<RecipeRatingFormProps> = ({
  recipeId,
  onRatingSubmitted,
}) => {
  const [score, setScore] = useState<number>(5)
  const [hoverScore, setHoverScore] = useState<number>(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (score < 1 || score > 5) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await saveRating(recipeId, { score, reviewText })
      setSuccess(true)
      setReviewText('')
      if (onRatingSubmitted) onRatingSubmitted()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeStarCount = hoverScore || score

  return (
    <form onSubmit={handleSubmit} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-8">
      <h3 className="text-lg font-bold text-slate-100 mb-2">Rate & Review this Recipe</h3>
      <p className="text-sm text-slate-400 mb-4">
        Share your experience, cooking tips, or rating with fellow home cooks!
      </p>

      {/* Star Selector */}
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setScore(star)}
            onMouseEnter={() => setHoverScore(star)}
            onMouseLeave={() => setHoverScore(0)}
            className="p-1 transition-transform hover:scale-110 focus:outline-none"
            aria-label={`Rate ${star} stars`}
          >
            <StarIcon
              className={`w-7 h-7 ${
                star <= activeStarCount
                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'text-slate-600'
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-sm font-semibold text-amber-400">
          {activeStarCount} / 5 Star{activeStarCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Optional: What did you think of the recipe? Did you make any substitutions?"
          className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors resize-none"
        />
        <div className="text-right text-xs text-slate-500 mt-1">
          {reviewText.length} / 1000
        </div>
      </div>

      {error && <div className="text-xs text-red-400 mb-3">{error}</div>}
      {success && <div className="text-xs text-emerald-400 mb-3">Your rating & review was posted successfully!</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
      >
        {isSubmitting ? 'Posting Review...' : 'Submit Review'}
      </button>
    </form>
  )
}

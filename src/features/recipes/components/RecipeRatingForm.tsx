import React, { useState } from 'react'
import { saveRating } from '../../../services/ratingApi'

interface RecipeRatingFormProps {
  recipeId: string
  currentUserRating?: number
  onRatingSubmitted?: () => void
}

const StarIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)

export const RecipeRatingForm: React.FC<RecipeRatingFormProps> = ({
  recipeId,
  currentUserRating = 0,
  onRatingSubmitted,
}) => {
  const [userScore, setUserScore] = useState<number>(currentUserRating)
  const [hoverScore, setHoverScore] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const handleRate = async (star: number) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setFeedbackMsg(null)

    try {
      await saveRating(recipeId, { score: star })
      setUserScore(star)
      setFeedbackMsg(`You rated this ${star} star${star > 1 ? 's' : ''}!`)
      if (onRatingSubmitted) onRatingSubmitted()
    } catch (err: any) {
      setFeedbackMsg('Could not save rating. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeStarCount = hoverScore || userScore

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {userScore > 0 ? 'Your Rating' : 'Rate this Recipe'}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {userScore > 0
            ? 'Tap a star to update your rating'
            : 'How did this turn out for you? Tap stars to rate!'}
        </p>
      </div>

      <div className="flex flex-col items-center sm:items-end gap-1">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverScore(star)}
              onMouseLeave={() => setHoverScore(0)}
              className="p-1 transition-all hover:scale-125 focus:outline-none cursor-pointer"
              aria-label={`Rate ${star} stars`}
            >
              <StarIcon
                className={`w-7 h-7 transition-colors ${
                  star <= activeStarCount
                    ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                    : 'text-gray-300 dark:text-slate-700'
                }`}
              />
            </button>
          ))}
        </div>
        {feedbackMsg && (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
            {feedbackMsg}
          </span>
        )}
      </div>
    </div>
  )
}

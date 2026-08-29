import React, { useEffect, useState, useCallback } from 'react'
import { getRatings, type RecipeRatingsResponse } from '../../../services/ratingApi'
import { RecipeRatingForm } from './RecipeRatingForm'

interface RecipeReviewsSectionProps {
  recipeId: string
  currentUserId?: string
  onRatingsLoaded?: (average: number, count: number) => void
}

const StarIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)

export const RecipeReviewsSection: React.FC<RecipeReviewsSectionProps> = ({
  recipeId,
  currentUserId,
  onRatingsLoaded,
}) => {
  const [data, setData] = useState<RecipeRatingsResponse | null>(null)

  const fetchRatings = useCallback(async () => {
    try {
      const res = await getRatings(recipeId, 0, 50, 'newest')
      setData(res)
      if (onRatingsLoaded) {
        onRatingsLoaded(res.averageRating || 0, res.ratingCount || 0)
      }
    } catch (err) {
      console.error('Failed to load ratings:', err)
    }
  }, [recipeId, onRatingsLoaded])

  useEffect(() => {
    fetchRatings()
  }, [fetchRatings])

  const averageRating = data?.averageRating || 0
  const ratingCount = data?.ratingCount || 0
  const dist = data?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  const currentUserRating = currentUserId
    ? data?.ratings?.find((r) => r.userId === currentUserId)?.score || 0
    : 0

  return (
    <section id="recipe-ratings-section" className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
        <StarIcon className="w-5 h-5 text-amber-400" />
        Community Rating Overview
      </h2>

      {/* Ratings Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 mb-6 shadow-xs">
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-800 pb-4 md:pb-0">
          <div className="text-5xl font-extrabold text-amber-400 tracking-tight">
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating)
                    ? 'text-amber-400'
                    : 'text-gray-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Based on {ratingCount} rating{ratingCount === 1 ? '' : 's'}
          </div>
        </div>

        <div className="md:col-span-2 space-y-2.5 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (dist as any)[star] || 0
            const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span className="w-12 font-medium">{star} Stars</span>
                <div className="flex-1 bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono font-semibold text-gray-500 dark:text-gray-400">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interactive Star Rating Bar */}
      {currentUserId && (
        <RecipeRatingForm
          recipeId={recipeId}
          currentUserRating={currentUserRating}
          onRatingSubmitted={fetchRatings}
        />
      )}
    </section>
  )
}

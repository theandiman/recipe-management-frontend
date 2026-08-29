import React, { useEffect, useState, useCallback } from 'react'
import { getRatings, deleteRating, type RecipeRatingsResponse, type Rating } from '../../../services/ratingApi'
import { RecipeRatingForm } from './RecipeRatingForm'

interface RecipeReviewsSectionProps {
  recipeId: string
  currentUserId?: string
}

const StarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)

const TrashIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export const RecipeReviewsSection: React.FC<RecipeReviewsSectionProps> = ({
  recipeId,
  currentUserId,
}) => {
  const [data, setData] = useState<RecipeRatingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest')

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getRatings(recipeId, 0, 20, sort)
      setData(res)
    } catch (err) {
      console.error('Failed to load ratings:', err)
    } finally {
      setLoading(false)
    }
  }, [recipeId, sort])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleDelete = async () => {
    try {
      await deleteRating(recipeId)
      fetchReviews()
    } catch (err) {
      console.error('Failed to delete rating:', err)
    }
  }

  const averageRating = data?.averageRating || 0
  const ratingCount = data?.ratingCount || 0
  const dist = data?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  return (
    <section className="mt-10 pt-8 border-t border-slate-800">
      <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
        <StarIcon className="w-5 h-5 text-amber-400" />
        Community Ratings & Reviews ({ratingCount})
      </h2>

      {/* Ratings Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0">
          <div className="text-4xl font-extrabold text-amber-400">{averageRating.toFixed(1)}</div>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating)
                    ? 'text-amber-400'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-slate-400">{ratingCount} total rating{ratingCount === 1 ? '' : 's'}</div>
        </div>

        <div className="md:col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (dist as any)[star] || 0
            const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-3 text-xs text-slate-400">
                <span className="w-12">{star} Stars</span>
                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Submit Rating Form */}
      {currentUserId && (
        <RecipeRatingForm recipeId={recipeId} onRatingSubmitted={fetchReviews} />
      )}

      {/* Filter & Review List */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-300">Reviews ({data?.ratings?.length || 0})</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 py-4">Loading reviews...</div>
      ) : !data?.ratings || data.ratings.length === 0 ? (
        <div className="text-sm text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-xl">
          No written reviews yet. Be the first to leave a review!
        </div>
      ) : (
        <div className="space-y-4">
          {data.ratings.map((review: Rating) => {
            const isOwner = currentUserId && currentUserId === review.userId
            return (
              <div
                key={review.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 transition-colors hover:border-slate-700/80"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-xs">
                      {review.authorName ? review.authorName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {review.authorName || 'Anonymous Chef'}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`w-3 h-3 ${
                              star <= review.score
                                ? 'text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    {isOwner && (
                      <button
                        onClick={handleDelete}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete your review"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {review.reviewText && (
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    {review.reviewText}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

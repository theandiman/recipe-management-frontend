import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getFollowers, getFollowing } from '../../services/userApi'
import type { FollowUser } from '../../services/userApi'

interface FollowListModalProps {
  uid: string
  type: 'followers' | 'following'
  onClose: () => void
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ uid, type, onClose }) => {
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        const fetcher = type === 'followers' ? getFollowers : getFollowing
        const result = await fetcher(uid, pageNum)
        setUsers((prev) => (append ? [...prev, ...result.users] : result.users))
        setHasMore(result.hasMore)
      } catch {
        setError('Failed to load list')
      }
    },
    [uid, type]
  )

  useEffect(() => {
    setLoading(true)
    setUsers([])
    setPage(1)
    setError(null)
    fetchPage(1, false).finally(() => setLoading(false))
  }, [fetchPage])

  const handleLoadMore = async () => {
    const nextPage = page + 1
    setLoadingMore(true)
    await fetchPage(nextPage, true)
    setPage(nextPage)
    setLoadingMore(false)
  }

  const title = type === 'followers' ? 'Followers' : 'Following'

  return (
    <AnimatePresence>
      <motion.div
        data-testid="follow-list-modal-backdrop"
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh]"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              aria-label="Close"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-4 py-3">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div
                  data-testid="follow-list-loading"
                  className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"
                />
              </div>
            ) : error ? (
              <p className="text-center text-red-600 dark:text-red-300 py-8 text-sm">{error}</p>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </p>
            ) : (
              <ul className="space-y-3">
                {users.map((u) => (
                  <li key={u.uid}>
                    <Link
                      to={`/user/${u.uid}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(u.displayName?.[0] ?? '?').toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {u.displayName}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Load More */}
            {hasMore && !loading && !error && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

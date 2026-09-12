import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useNotifications } from '../../features/notifications/NotificationContext'
import type { SocialNotification } from '../../services/notificationApi'
import { UserAvatar } from '../UserAvatar'
import { formatRelativeTime } from '../../utils/timeUtils'

export const RecentSocialActivity: React.FC = () => {
  const navigate = useNavigate()
  const { notifications, isLoading, error, fetchNotifications, markItemRead } = useNotifications()

  const handleItemClick = (item: SocialNotification) => {
    if (!item.isRead) {
      markItemRead(item.id).catch((err) => {
        console.error('Failed to mark notification read:', err)
      })
    }

    if (item.targetRecipeId) {
      navigate(`/recipes/${item.targetRecipeId}`)
    } else if (item.actorUid) {
      navigate(`/user/${item.actorUid}`)
    }
  }

  const getEventDescription = (item: SocialNotification) => {
    switch (item.eventType) {
      case 'RECIPE_LIKE':
        return 'liked your recipe'
      case 'RECIPE_RATING':
        return 'reviewed'
      case 'RECIPE_COMMENT':
        return 'commented on'
      case 'NEW_FOLLOWER':
        return 'started following you'
      default:
        return 'interacted with you'
    }
  }

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'RECIPE_LIKE':
        return (
          <span className="p-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-500" title="Like">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
        )
      case 'RECIPE_RATING':
        return (
          <span className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-500" title="Review">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
        )
      case 'RECIPE_COMMENT':
        return (
          <span className="p-1 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-500" title="Comment">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
        )
      case 'NEW_FOLLOWER':
        return (
          <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500" title="Follower">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </span>
        )
      default:
        return null
    }
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-700 p-6 transition-colors"
      aria-labelledby="recent-activity-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 id="recent-activity-heading" className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Recent Activity
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading recent activity"
          className="space-y-3 animate-pulse"
          data-testid="activity-loading-skeleton"
        >
          <span className="sr-only">Loading recent activity...</span>
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-750">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-2.5 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-850 text-xs text-gray-500 dark:text-gray-400 text-center">
          <span>Couldn't load recent activity.</span>
          <button
            onClick={() => fetchNotifications()}
            className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : recentNotifications.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-850/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No recent activity yet. When cooks like, review, or comment on your recipes, updates will appear here!
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-slate-700/60" role="list">
          {recentNotifications.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                  !item.isRead ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <UserAvatar src={item.actorAvatarUrl} name={item.actorName || 'User'} size="md" />
                  <div className="absolute -bottom-1 -right-1">
                    {getEventBadge(item.eventType)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 dark:text-gray-200 leading-snug">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.actorName || 'A cook'}
                    </span>{' '}
                    {getEventDescription(item)}{' '}
                    {item.targetRecipeName && (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        "{item.targetRecipeName}"
                      </span>
                    )}
                  </p>

                  {item.contentSnippet && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate mt-0.5">
                      "{item.contentSnippet}"
                    </p>
                  )}

                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
                    {item.createdAt ? formatRelativeTime(item.createdAt) : 'just now'}
                  </span>
                </div>

                {!item.isRead && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2"
                    aria-label="Unread notification"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  )
}

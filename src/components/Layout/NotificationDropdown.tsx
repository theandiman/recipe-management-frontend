import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { SocialNotification } from '../../services/notificationApi'

interface NotificationDropdownProps {
  notifications: SocialNotification[]
  unreadCount: number
  onMarkAllRead: () => void
  onClose: () => void
}

const HeartIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

const StarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)

const MessageIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const UserPlusIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
)

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAllRead,
  onClose,
}) => {
  const navigate = useNavigate()

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'RECIPE_LIKE':
        return <HeartIcon className="w-4 h-4 text-rose-500" />
      case 'RECIPE_RATING':
        return <StarIcon className="w-4 h-4 text-amber-400" />
      case 'RECIPE_COMMENT':
        return <MessageIcon className="w-4 h-4 text-sky-400" />
      case 'NEW_FOLLOWER':
        return <UserPlusIcon className="w-4 h-4 text-emerald-400" />
      default:
        return <HeartIcon className="w-4 h-4 text-amber-400" />
    }
  }

  const handleNotificationClick = (item: SocialNotification) => {
    onClose()
    if (item.targetRecipeId) {
      navigate(`/dashboard/recipes/${item.targetRecipeId}`)
    } else if (item.actorUid) {
      navigate(`/user/${item.actorUid}`)
    }
  }

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-100">Activity Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No notifications yet. Activity will appear here!
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                !item.isRead ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-800 shrink-0">
                {getEventIcon(item.eventType)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 leading-snug">
                  <span className="font-semibold text-slate-100">{item.actorName || 'A user'}</span>{' '}
                  {item.eventType === 'RECIPE_LIKE' && 'liked your recipe'}
                  {item.eventType === 'RECIPE_RATING' && 'left a review on'}
                  {item.eventType === 'RECIPE_COMMENT' && 'commented on'}
                  {item.eventType === 'NEW_FOLLOWER' && 'started following you'}
                  {item.targetRecipeName && (
                    <span className="font-semibold text-amber-400"> "{item.targetRecipeName}"</span>
                  )}
                </p>

                {item.contentSnippet && (
                  <p className="text-xs text-slate-400 truncate mt-1 italic">
                    "{item.contentSnippet}"
                  </p>
                )}

                <span className="text-[10px] text-slate-500 mt-1 block">
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useState, useRef } from 'react'
import { getNotifications, markNotificationsAsRead, type NotificationsResponse } from '../../services/notificationApi'
import { NotificationDropdown } from './NotificationDropdown'

const BellIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications(0, 20)
      setData(res)
    } catch {
      // Ignore when unauthenticated
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsAsRead()
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark notifications read:', err)
    }
  }

  const handleMarkItemRead = async (id: string) => {
    try {
      await markNotificationsAsRead([id])
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }

  const unreadCount = data?.unreadCount || 0

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
        aria-label="Activity Notifications"
        title="Activity Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={data?.notifications || []}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onMarkItemRead={handleMarkItemRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

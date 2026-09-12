import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  getNotifications,
  markNotificationsAsRead,
  type SocialNotification,
  type NotificationsResponse,
} from '../../services/notificationApi'
import { AuthContext } from '../auth/AuthContext'

export interface NotificationContextType {
  notifications: SocialNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markItemRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

export const defaultNotificationContext: NotificationContextType = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  fetchNotifications: async () => {},
  markItemRead: async () => {},
  markAllRead: async () => {},
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  return context ?? defaultNotificationContext
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext)
  const isAuthenticated = auth ? auth.isAuthenticated : true
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null)
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const res = await getNotifications(0, 20)
      if (isMountedRef.current) {
        setData(res)
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch notifications'
        setError(msg)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    isMountedRef.current = true
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => {
      isMountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchNotifications])

  const markItemRead = useCallback(async (id: string) => {
    // Optimistic update across all listening components
    setData((prev) => {
      if (!prev) return null
      const target = prev.notifications.find((n) => n.id === id)
      const wasUnread = target && !target.isRead
      return {
        ...prev,
        unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      }
    })

    try {
      await markNotificationsAsRead([id])
    } catch (err) {
      console.error('Failed to mark notification read:', err)
      fetchNotifications()
    }
  }, [fetchNotifications])

  const markAllRead = useCallback(async () => {
    setData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        unreadCount: 0,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
      }
    })

    try {
      await markNotificationsAsRead()
    } catch (err) {
      console.error('Failed to mark all notifications read:', err)
      fetchNotifications()
    }
  }, [fetchNotifications])

  const value: NotificationContextType = {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    fetchNotifications,
    markItemRead,
    markAllRead,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

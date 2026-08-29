import axios from 'axios'
import { auth } from '../config/firebase'
import { buildApiUrl } from '../utils/apiUtils'

const RAW_API_BASE = import.meta.env.VITE_MANAGEMENT_API_URL
const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'
const API_BASE = RAW_API_BASE?.trim() || ''

export type NotificationType = 'RECIPE_LIKE' | 'RECIPE_RATING' | 'RECIPE_COMMENT' | 'NEW_FOLLOWER'

export interface SocialNotification {
  id: string
  recipientUid: string
  actorUid: string
  actorName: string
  actorAvatarUrl?: string
  eventType: NotificationType
  targetRecipeId?: string
  targetRecipeName?: string
  contentSnippet?: string
  isRead: boolean
  createdAt: string
}

export interface NotificationsResponse {
  unreadCount: number
  notifications: SocialNotification[]
  hasMore: boolean
}

const getHeaders = async (requireAuth = false): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!IS_TEST_MODE) {
    const user = auth.currentUser
    if (requireAuth && !user) {
      throw new Error('User not authenticated')
    }
    if (user) {
      const token = await user.getIdToken()
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

export async function getNotifications(page = 0, size = 20): Promise<NotificationsResponse> {
  const url = buildApiUrl(API_BASE, `/api/users/me/notifications`)
  const headers = await getHeaders(true)
  const response = await axios.get<NotificationsResponse>(url, {
    headers,
    params: { page, size },
  })
  return response.data
}

export async function markNotificationsAsRead(notificationIds?: string[]): Promise<void> {
  const url = buildApiUrl(API_BASE, `/api/users/me/notifications/read`)
  const headers = await getHeaders(true)
  await axios.post(url, { notificationIds }, { headers })
}

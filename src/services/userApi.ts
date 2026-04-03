import axios from 'axios'
import { buildApiUrl } from '../utils/apiUtils'
import type { Recipe } from '../types/nutrition'

const USER_API_BASE = import.meta.env.VITE_STORAGE_API_URL || ''
const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'

export interface UserProfile {
  uid: string
  displayName: string
  avatarUrl?: string
  bio?: string
  publicRecipeCount: number
  publicRecipes: Recipe[]
  isFollowedByCurrentUser?: boolean
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/profile`)
  const headers = await getAuthHeaders()
  const response = await axios.get<UserProfile>(url, { headers })
  return response.data
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!IS_TEST_MODE) {
    const { auth } = await import('../config/firebase')
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

export async function followUser(uid: string): Promise<void> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/follow`)
  const headers = await getAuthHeaders()
  await axios.post(url, {}, { headers })
}

export async function unfollowUser(uid: string): Promise<void> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/follow`)
  const headers = await getAuthHeaders()
  await axios.delete(url, { headers })
}

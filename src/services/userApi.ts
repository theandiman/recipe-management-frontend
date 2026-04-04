import axios from 'axios'
import { buildApiUrl } from '../utils/apiUtils'
import type { Recipe } from '../types/nutrition'

const RAW_USER_API_BASE = import.meta.env.VITE_MANAGEMENT_API_URL
const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'
const USER_API_BASE = (() => {
  const apiBase = RAW_USER_API_BASE?.trim() || ''

  if (!IS_TEST_MODE && !apiBase) {
    throw new Error(
      'Missing required environment variable: VITE_MANAGEMENT_API_URL. Set it explicitly unless VITE_TEST_MODE is "true".',
    )
  }

  return apiBase
})()
export interface UserProfile {
  uid: string
  displayName: string
  avatarUrl?: string
  bio?: string
  publicRecipeCount: number
  publicRecipes: Recipe[]
  followerCount?: number
  followingCount?: number
  isFollowedByCurrentUser?: boolean
}

export interface FollowUser {
  uid: string
  displayName: string
  avatarUrl?: string
}

export interface FollowListPage {
  users: FollowUser[]
  hasMore: boolean
}

const getUserApiHeaders = async (requireAuth = false): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!IS_TEST_MODE) {
    const { auth } = await import('../config/firebase')
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

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/profile`)
  const headers = await getUserApiHeaders(false)

  const response = await axios.get<UserProfile>(url, { headers })
  const profile = response.data

  return {
    ...profile,
    publicRecipes: Array.isArray(profile.publicRecipes)
      ? profile.publicRecipes
      : Array.isArray((profile.publicRecipes as unknown as { recipes?: Recipe[] } | undefined)?.recipes)
        ? ((profile.publicRecipes as unknown as { recipes: Recipe[] }).recipes || [])
        : [],
  }
}

export async function followUser(uid: string): Promise<void> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/follow`)
  const headers = await getUserApiHeaders(true)

  await axios.post(url, null, { headers })
}

export async function unfollowUser(uid: string): Promise<void> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/follow`)
  const headers = await getUserApiHeaders(true)

  await axios.delete(url, { headers })
}

export async function getFollowers(uid: string, page = 1): Promise<FollowListPage> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/followers?page=${page}`)
  const headers = await getUserApiHeaders(false)

  const response = await axios.get<FollowListPage>(url, { headers })
  return response.data
}

export async function getFollowing(uid: string, page = 1): Promise<FollowListPage> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/following?page=${page}`)
  const headers = await getUserApiHeaders(false)

  const response = await axios.get<FollowListPage>(url, { headers })
  return response.data
}

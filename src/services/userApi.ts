import axios from 'axios'
import { buildApiUrl } from '../utils/apiUtils'
import type { Recipe } from '../types/nutrition'

const USER_API_BASE = import.meta.env.VITE_STORAGE_API_URL || ''

export interface UserProfile {
  uid: string
  displayName: string
  avatarUrl?: string
  bio?: string
  publicRecipeCount: number
  publicRecipes: Recipe[]
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const url = buildApiUrl(USER_API_BASE, `/api/users/${uid}/profile`)
  const response = await axios.get<UserProfile>(url)
  return response.data
}

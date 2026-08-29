import axios from 'axios'
import { auth } from '../config/firebase'
import { buildApiUrl } from '../utils/apiUtils'

const RAW_API_BASE = import.meta.env.VITE_MANAGEMENT_API_URL
const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'
const API_BASE = RAW_API_BASE?.trim() || ''

export interface Rating {
  id: string
  recipeId: string
  userId: string
  authorName?: string
  authorAvatarUrl?: string
  score: number
  reviewText?: string
  createdAt: string
  updatedAt: string
}

export interface RatingDistribution {
  '1': number
  '2': number
  '3': number
  '4': number
  '5': number
}

export interface RecipeRatingsResponse {
  averageRating: number
  ratingCount: number
  distribution: RatingDistribution
  ratings: Rating[]
  hasMore: boolean
}

export interface CreateRatingRequest {
  score: number
  reviewText?: string
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

export async function saveRating(
  recipeId: string,
  request: CreateRatingRequest
): Promise<Rating> {
  const url = buildApiUrl(API_BASE, `/api/recipes/${recipeId}/ratings`)
  const headers = await getHeaders(true)
  const response = await axios.post<Rating>(url, request, { headers })
  return response.data
}

export async function getRatings(
  recipeId: string,
  page = 0,
  size = 10,
  sort = 'newest'
): Promise<RecipeRatingsResponse> {
  const url = buildApiUrl(API_BASE, `/api/recipes/${recipeId}/ratings`)
  const headers = await getHeaders(false)
  const response = await axios.get<RecipeRatingsResponse>(url, {
    headers,
    params: { page, size, sort },
  })
  return response.data
}

export async function deleteRating(recipeId: string): Promise<void> {
  const url = buildApiUrl(API_BASE, `/api/recipes/${recipeId}/ratings/me`)
  const headers = await getHeaders(true)
  await axios.delete(url, { headers })
}

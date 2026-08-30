import axios from 'axios'
import { auth } from '../config/firebase'
import { buildApiUrl } from '../utils/apiUtils'

const RAW_API_BASE = import.meta.env.VITE_MANAGEMENT_API_URL
const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'
const API_BASE = RAW_API_BASE?.trim() || ''

export interface CommentItem {
  id: string
  recipeId: string
  userId: string
  authorName?: string
  authorAvatarUrl?: string
  content: string
  parentId?: string | null
  likeCount?: number
  createdAt: string
  updatedAt: string
  replies?: CommentItem[]
}

export interface CommentsResponse {
  totalComments: number
  comments: CommentItem[]
  hasMore: boolean
}

export interface CreateCommentRequest {
  content: string
  parentId?: string | null
}

export interface UpdateCommentRequest {
  content: string
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

export async function createComment(
  recipeId: string,
  request: CreateCommentRequest
): Promise<CommentItem> {
  const url = buildApiUrl(API_BASE, `/api/recipes/${recipeId}/comments`)
  const headers = await getHeaders(true)
  const response = await axios.post<CommentItem>(url, request, { headers })
  return response.data
}

export async function getComments(
  recipeId: string,
  page = 0,
  size = 20
): Promise<CommentsResponse> {
  const url = buildApiUrl(API_BASE, `/api/recipes/${recipeId}/comments`)
  const headers = await getHeaders(false)
  const response = await axios.get<CommentsResponse>(url, {
    headers,
    params: { page, size },
  })
  return response.data
}

export async function updateComment(
  commentId: string,
  request: UpdateCommentRequest
): Promise<CommentItem> {
  const url = buildApiUrl(API_BASE, `/api/comments/${commentId}`)
  const headers = await getHeaders(true)
  const response = await axios.put<CommentItem>(url, request, { headers })
  return response.data
}

export async function deleteComment(commentId: string): Promise<void> {
  const url = buildApiUrl(API_BASE, `/api/comments/${commentId}`)
  const headers = await getHeaders(true)
  await axios.delete(url, { headers })
}

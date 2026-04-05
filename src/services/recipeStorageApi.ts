import { postWithAuth } from '../utils/authApi'
import { buildApiUrl } from '../utils/apiUtils'
import { uploadRecipeImage, deleteRecipeImage } from '../utils/imageStorage'
import type { Recipe, RecipeTips } from '../types/nutrition'
import { RecipeUtils } from '@theandiman/recipe-management-shared/dist/types/recipe'

const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'

const resolveManagementApiBase = (): string => {
  const managementApiUrl = import.meta.env.VITE_MANAGEMENT_API_URL?.trim()

  if (managementApiUrl) {
    return managementApiUrl
  }

  if (IS_TEST_MODE) {
    return ''
  }

  throw new Error('Missing required VITE_MANAGEMENT_API_URL environment variable')
}

const MANAGEMENT_API_BASE = resolveManagementApiBase()
type NutritionPerServing = NonNullable<NonNullable<Recipe['nutritionalInfo']>['perServing']>

type ManagementRecipePayload = Partial<Recipe> & {
  title?: string
  prepTime?: number | string
  cookTime?: number | string
  nutrition?: NutritionPerServing | null
  tips?: Record<string, unknown> | RecipeTips | null
  public?: boolean
}

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const parseTimeToMinutes = (value?: string | number | unknown): number | undefined => {
  if (value === undefined || value === null) return undefined

  if (typeof value === 'number') {
    return value > 0 ? Math.floor(value) : undefined
  }

  const timeStr = String(value).trim()
  if (!timeStr) return undefined

  const match = timeStr.match(/(\d+)\s*(minute|min|hour|hr)/i)
  if (match) {
    const amount = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()
    return unit.startsWith('hour') || unit.startsWith('hr') ? amount * 60 : amount
  }

  const num = parseInt(timeStr, 10)
  return Number.isNaN(num) || num <= 0 ? undefined : num
}

const normalizeTipText = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  const items = normalizeStringArray(value)
  return items.length ? items.join(' ') : undefined
}

const normalizeTips = (tips?: Record<string, unknown> | RecipeTips | null): RecipeTips | undefined => {
  if (!tips || typeof tips !== 'object') {
    return undefined
  }

  const normalizedTips: RecipeTips = {}
  const substitutions = normalizeStringArray((tips as { substitutions?: unknown }).substitutions)
  const variations = normalizeStringArray((tips as { variations?: unknown }).variations)
  const makeAhead = normalizeTipText((tips as { makeAhead?: unknown }).makeAhead)
  const storage = normalizeTipText((tips as { storage?: unknown }).storage)
  const reheating = normalizeTipText((tips as { reheating?: unknown }).reheating)

  if (substitutions.length) normalizedTips.substitutions = substitutions
  if (variations.length) normalizedTips.variations = variations
  if (makeAhead) normalizedTips.makeAhead = makeAhead
  if (storage) normalizedTips.storage = storage
  if (reheating) normalizedTips.reheating = reheating

  return Object.keys(normalizedTips).length > 0 ? normalizedTips : undefined
}

const normalizeRecipe = (recipe: ManagementRecipePayload): Recipe => {
  const prepTimeMinutes = recipe.prepTimeMinutes ?? parseTimeToMinutes(recipe.prepTime)
  const cookTimeMinutes = recipe.cookTimeMinutes ?? parseTimeToMinutes(recipe.cookTime)
  const recipeName =
    typeof recipe.recipeName === 'string' && recipe.recipeName.trim()
      ? recipe.recipeName
      : typeof recipe.title === 'string' && recipe.title.trim()
        ? recipe.title
        : 'Untitled Recipe'

  const normalized: Recipe = {
    ...recipe,
    recipeName,
    ingredients: normalizeStringArray(recipe.ingredients),
    instructions: normalizeStringArray(recipe.instructions),
    servings: RecipeUtils.getServingsAsNumber(recipe.servings ?? 1),
    source: recipe.source || 'manual',
  }

  if (prepTimeMinutes !== undefined) {
    normalized.prepTimeMinutes = prepTimeMinutes
    if (typeof recipe.prepTime !== 'string') {
      normalized.prepTime = `${prepTimeMinutes} min`
    }
  } else if (typeof recipe.prepTime === 'string') {
    normalized.prepTime = recipe.prepTime
  }

  if (cookTimeMinutes !== undefined) {
    normalized.cookTimeMinutes = cookTimeMinutes
    if (typeof recipe.cookTime !== 'string') {
      normalized.cookTime = `${cookTimeMinutes} min`
    }
  } else if (typeof recipe.cookTime === 'string') {
    normalized.cookTime = recipe.cookTime
  }

  if (recipe.nutritionalInfo) {
    normalized.nutritionalInfo = recipe.nutritionalInfo
  } else if (recipe.nutrition && typeof recipe.nutrition === 'object') {
    normalized.nutritionalInfo = { perServing: recipe.nutrition }
  }

  const normalizedTips = normalizeTips(recipe.tips)
  if (normalizedTips) {
    normalized.tips = normalizedTips
  }

  if (Array.isArray(recipe.tags)) {
    normalized.tags = normalizeStringArray(recipe.tags)
  }

  if (Array.isArray(recipe.dietaryRestrictions)) {
    normalized.dietaryRestrictions = normalizeStringArray(recipe.dietaryRestrictions)
  }

  if (recipe.isPublic !== undefined || recipe.public !== undefined) {
    normalized.isPublic = recipe.isPublic ?? Boolean(recipe.public)
  }

  return normalized
}

const extractRecipes = (payload: unknown): Recipe[] => {
  if (Array.isArray(payload)) {
    return payload.map((recipe) => normalizeRecipe(recipe as ManagementRecipePayload))
  }

  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { recipes?: unknown }).recipes)
  ) {
    return ((payload as { recipes: ManagementRecipePayload[] }).recipes || []).map((recipe) => normalizeRecipe(recipe))
  }

  return []
}

/**
 * Request DTO for creating a recipe in the management service
 */
export interface CreateRecipeRequest {
  title: string
  description?: string
  ingredients: string[]
  instructions: string[]
  prepTime?: number
  cookTime?: number
  servings: number
  nutrition?: NutritionPerServing
  tips?: Record<string, string[]>
  imageUrl?: string
  source: string
  tags?: string[]
  dietaryRestrictions?: string[]
}

/**
 * Convert AI-generated Recipe to CreateRecipeRequest
 */
const mapRecipeToCreateRequest = (recipe: Recipe): CreateRecipeRequest => {
  const mapTips = (tips?: RecipeTips): Record<string, string[]> | undefined => {
    if (!tips) return undefined

    const result: Record<string, string[]> = {}

    if (tips.substitutions?.length) {
      result.substitutions = tips.substitutions
    }
    if (tips.makeAhead) {
      result.makeAhead = [tips.makeAhead]
    }
    if (tips.storage) {
      result.storage = [tips.storage]
    }
    if (tips.reheating) {
      result.reheating = [tips.reheating]
    }
    if (tips.variations?.length) {
      result.variations = tips.variations
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  const imageUrl = recipe.imageUrl?.startsWith('data:') ? undefined : recipe.imageUrl

  return {
    title: recipe.recipeName,
    description: recipe.description,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    prepTime: recipe.prepTimeMinutes ?? parseTimeToMinutes(recipe.prepTime),
    cookTime: recipe.cookTimeMinutes ?? parseTimeToMinutes(recipe.cookTime),
    servings: RecipeUtils.getServingsAsNumber(recipe.servings),
    nutrition: recipe.nutritionalInfo?.perServing,
    tips: mapTips(recipe.tips),
    imageUrl,
    source: recipe.source || 'ai-generated',
    tags: recipe.tags || [],
    dietaryRestrictions: recipe.dietaryRestrictions || []
  }
}

/**
 * Save a recipe to the management service
 * @param recipe - The AI-generated recipe to save
 * @returns The saved recipe with ID and metadata
 */
export const saveRecipe = async (recipe: Recipe): Promise<Recipe> => {
  const url = buildApiUrl(MANAGEMENT_API_BASE, '/api/recipes')
  let request = mapRecipeToCreateRequest(recipe)
  
  // If there's a base64 image, upload it to Firebase Storage first
  if (recipe.imageUrl?.startsWith('data:')) {
    try {
      // Generate a temporary ID for the image (will use recipe ID later)
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const downloadURL = await uploadRecipeImage(recipe.imageUrl, tempId)
      
      // Update request with Firebase Storage URL
      request = {
        ...request,
        imageUrl: downloadURL
      }
    } catch (error) {
      console.error('Failed to upload image, saving recipe without image:', error)
      // Continue without image rather than failing completely
      request = {
        ...request,
        imageUrl: undefined
      }
    }
  }
  
  if (IS_TEST_MODE) {
    // In test mode, use direct axios call without authentication
    const { default: axios } = await import('axios')
    const response = await axios.post(url, request, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return normalizeRecipe(response.data)
  } else {
    // Normal mode with authentication
    const response = await postWithAuth(url, request)
    return normalizeRecipe(response.data)
  }
}

/**
 * Fetch all recipes for the current user
 * @returns List of recipes
 */
export const getRecipes = async (): Promise<Recipe[]> => {
  const url = buildApiUrl(MANAGEMENT_API_BASE, '/api/recipes')
  const { default: axios } = await import('axios')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!IS_TEST_MODE) {
    const { auth } = await import('../config/firebase')
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
  }

  const response = await axios.get(url, { headers })

  return extractRecipes(response.data)
}

/**
 * Fetch a single recipe by ID
 * @param id - The recipe ID
 * @returns The recipe
 */
export const getRecipe = async (id: string): Promise<Recipe> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')
  
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}`)
  
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  return normalizeRecipe(response.data)
}

/**
 * Update an existing recipe
 * @param id - The recipe ID to update
 * @param recipe - The updated recipe data
 * @returns The updated recipe
 */
export const updateRecipe = async (id: string, recipe: Recipe): Promise<Recipe> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')
  
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}`)
  
  let request = mapRecipeToCreateRequest(recipe)
  
  // If there's a base64 image, upload it to Firebase Storage first
  if (recipe.imageUrl?.startsWith('data:')) {
    try {
      const downloadURL = await uploadRecipeImage(recipe.imageUrl, id)
      request = {
        ...request,
        imageUrl: downloadURL
      }
    } catch (error) {
      console.error('Failed to upload image, updating recipe without new image:', error)
      // Continue with existing image
      request = {
        ...request,
        imageUrl: undefined
      }
    }
  }
  
  const response = await axios.put(url, request, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  return normalizeRecipe(response.data)
}

/**
 * Delete a recipe by ID
 * @param id - The recipe ID to delete
 */
export const deleteRecipe = async (id: string): Promise<void> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')
  
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}`)
  
  // Delete recipe from backend
  await axios.delete(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  // Delete associated image from Firebase Storage
  // This runs after backend deletion to ensure recipe is gone first
  try {
    await deleteRecipeImage(id)
  } catch (error) {
    // Log but don't throw - image might not exist or already deleted
    console.warn('Failed to delete recipe image:', error)
  }
}

/**
 * Fetch the following feed for the current user (recipes from followed users)
 * @returns List of recipes from followed users
 */
export const getFeed = async (): Promise<Recipe[]> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')

  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, '/api/feed')

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  return extractRecipes(response.data)
}

/**
 * Fetch all public recipes from all users (no authentication required)
 * @returns List of public recipes
 */
export const getPublicRecipes = async (): Promise<Recipe[]> => {
  const { default: axios } = await import('axios')
  const url = buildApiUrl(MANAGEMENT_API_BASE, '/api/recipes/public')

  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return extractRecipes(response.data)
}

/**
 * Save (bookmark) a recipe for the current user
 * @param id - The recipe ID to save
 */
export const bookmarkRecipe = async (id: string): Promise<void> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')

  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}/save`)

  await axios.post(url, null, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Remove (un-bookmark) a saved recipe for the current user
 * @param id - The recipe ID to unsave
 */
export const unbookmarkRecipe = async (id: string): Promise<void> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')

  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}/save`)

  await axios.delete(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Fetch all saved (bookmarked) recipes for the current user
 * @returns List of saved recipes
 */
export const getSavedRecipes = async (): Promise<Recipe[]> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')

  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, '/api/recipes/saved')

  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  return extractRecipes(response.data)
}

/**
 * Update recipe sharing status (public/private)
 * @param id - The recipe ID
 * @param isPublic - Whether the recipe should be public
 * @returns The updated recipe
 */
export const updateRecipeSharing = async (id: string, isPublic: boolean): Promise<Recipe> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')
  
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}/sharing`)
  
  const response = await axios.patch(url, { isPublic }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  return normalizeRecipe(response.data)
}

export default {
  saveRecipe,
  getRecipes,
  getPublicRecipes,
  getFeed,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  updateRecipeSharing,
  bookmarkRecipe,
  unbookmarkRecipe,
  getSavedRecipes
}

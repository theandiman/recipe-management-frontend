import axios from 'axios'
import { postWithAuth } from '../utils/authApi'
import { buildApiUrl } from '../utils/apiUtils'
import { uploadRecipeImage, deleteRecipeImage } from '../utils/imageStorage'
import type { Recipe, RecipeTips } from '../types/nutrition'
import { RecipeUtils } from '@theandiman/recipe-management-shared/dist/types/recipe'
import { auth } from '../config/firebase'

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

const getFirstField = (obj: Record<string, unknown> | null | undefined, keys: string[]): unknown => {
  if (!obj) return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return undefined
}

const normalizeTipText = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  const items = normalizeStringArray(value)
  return items.length ? items.join(' • ') : undefined
}

const normalizeTips = (
  tips?: Record<string, unknown> | RecipeTips | null,
  rawRecipe?: Record<string, unknown> | null
): RecipeTips | undefined => {
  const tipsObj = tips && typeof tips === 'object' ? (tips as Record<string, unknown>) : null
  const rawObj = rawRecipe && typeof rawRecipe === 'object' ? rawRecipe : null

  const substitutionsRaw =
    getFirstField(tipsObj, ['substitutions', 'ingredientSubstitutions', 'ingredient_substitutions']) ??
    getFirstField(rawObj, ['substitutions', 'ingredientSubstitutions', 'ingredient_substitutions'])

  const variationsRaw =
    getFirstField(tipsObj, ['variations', 'recipeVariations', 'recipe_variations']) ??
    getFirstField(rawObj, ['variations', 'recipeVariations', 'recipe_variations'])

  const makeAheadRaw =
    getFirstField(tipsObj, ['makeAhead', 'makeAheadTips', 'make_ahead', 'make_ahead_tips']) ??
    getFirstField(rawObj, ['makeAhead', 'makeAheadTips', 'make_ahead', 'make_ahead_tips'])

  const storageRaw =
    getFirstField(tipsObj, ['storage', 'storageInstructions', 'storage_instructions']) ??
    getFirstField(rawObj, ['storage', 'storageInstructions', 'storage_instructions'])

  const reheatingRaw =
    getFirstField(tipsObj, ['reheating', 'reheatingInstructions', 'reheating_instructions']) ??
    getFirstField(rawObj, ['reheating', 'reheatingInstructions', 'reheating_instructions'])

  const substitutions = normalizeStringArray(substitutionsRaw)
  const variations = normalizeStringArray(variationsRaw)
  const makeAhead = normalizeTipText(makeAheadRaw)
  const storage = normalizeTipText(storageRaw)
  const reheating = normalizeTipText(reheatingRaw)

  const normalizedTips: RecipeTips = {}
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

  const normalizedTips = normalizeTips(recipe.tips, recipe as Record<string, unknown>)
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
  const normalizedTips = normalizeTips(
    recipe.tips as Record<string, unknown>,
    recipe as unknown as Record<string, unknown>
  )

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

  const prepTime = (typeof recipe.prepTimeMinutes === 'number' && recipe.prepTimeMinutes > 0)
    ? recipe.prepTimeMinutes
    : parseTimeToMinutes(recipe.prepTime)

  const cookTime = (typeof recipe.cookTimeMinutes === 'number' && recipe.cookTimeMinutes > 0)
    ? recipe.cookTimeMinutes
    : parseTimeToMinutes(recipe.cookTime)

  return {
    title: recipe.recipeName,
    description: recipe.description,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    prepTime,
    cookTime,
    servings: RecipeUtils.getServingsAsNumber(recipe.servings),
    nutrition: recipe.nutritionalInfo?.perServing,
    tips: mapTips(normalizedTips),
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!IS_TEST_MODE) {
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
export const getPublicRecipe = async (id: string): Promise<Recipe> => {
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}/public`)

  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return normalizeRecipe(response.data)
}

export const getRecipe = async (id: string): Promise<Recipe> => {
  const user = auth.currentUser
  if (!user) {
    return getPublicRecipe(id)
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}`)

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    return normalizeRecipe(response.data)
  } catch (err: unknown) {
    const apiError = err as { response?: { status?: number } }
    if (apiError.response?.status === 403 || apiError.response?.status === 404) {
      return getPublicRecipe(id)
    }
    throw err
  }
}

/**
 * Update an existing recipe
 * @param id - The recipe ID to update
 * @param recipe - The updated recipe data
 * @returns The updated recipe
 */
export const updateRecipe = async (id: string, recipe: Recipe): Promise<Recipe> => {
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
 * Fetch all public recipes from all users (authentication is optional;
 * attaching a token allows user-specific fields like isLikedByCurrentUser to be returned).
 * @returns List of public recipes
 */
export const getPublicRecipes = async (): Promise<Recipe[]> => {
  const url = buildApiUrl(MANAGEMENT_API_BASE, '/api/recipes/public')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const user = auth.currentUser
  if (user) {
    try {
      const token = await user.getIdToken()
      headers['Authorization'] = `Bearer ${token}`
    } catch (e) {
      console.warn('Failed to get auth token for public recipes request', e)
    }
  }

  const response = await axios.get(url, { headers })

  return extractRecipes(response.data)
}

/**
 * Save (bookmark) a recipe for the current user
 * @param id - The recipe ID to save
 */
export const bookmarkRecipe = async (id: string): Promise<void> => {
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
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}/sharing`)
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  try {
    const response = await axios.patch(url, { isPublic }, { headers })
    return normalizeRecipe(response.data)
  } catch (error: unknown) {
    const isNetworkOrMethodError = (err: unknown): boolean => {
      if (!err || typeof err !== 'object') return false
      const maybeAxios = err as { response?: { status?: number } }
      // Fallback on network/CORS error (no response) or 405 Method Not Allowed
      return !maybeAxios.response || maybeAxios.response.status === 405
    }

    if (isNetworkOrMethodError(error)) {
      try {
        const fallbackResponse = await axios.put(url, { isPublic }, { headers })
        return normalizeRecipe(fallbackResponse.data)
      } catch {
        throw error
      }
    }

    throw error
  }
}

/**
 * Like a recipe for the current user
 * @param id - The recipe ID to like
 */
export const likeRecipe = async (id: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}/like`)

  await axios.post(url, null, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Unlike a recipe for the current user
 * @param id - The recipe ID to unlike
 */
export const unlikeRecipe = async (id: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(MANAGEMENT_API_BASE, `/api/recipes/${id}/like`)

  await axios.delete(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

export default {
  saveRecipe,
  getRecipes,
  getPublicRecipes,
  getPublicRecipe,
  getFeed,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  updateRecipeSharing,
  bookmarkRecipe,
  unbookmarkRecipe,
  getSavedRecipes,
  likeRecipe,
  unlikeRecipe,
}

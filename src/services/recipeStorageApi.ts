import { postWithAuth } from '../utils/authApi'
import { buildApiUrl } from '../utils/apiUtils'
import { uploadRecipeImage, deleteRecipeImage } from '../utils/imageStorage'
import type { Recipe, RecipeTips } from '../types/nutrition'

const STORAGE_API_BASE = import.meta.env.VITE_STORAGE_API_URL || ''
const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true'

/**
 * Request DTO for creating a recipe in the storage service
 */
export interface CreateRecipeRequest {
  recipeName: string
  description?: string
  ingredients: string[]
  instructions: string[]
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  servings: number
  nutritionalInfo?: {
    perServing?: {
      calories: number
      protein: number
      carbohydrates: number
      fat: number
      fiber: number
      sodium: number
    }
  }
  tips?: Record<string, string | string[]> // Backend expects strings for makeAhead/storage/reheating, arrays for substitutions/variations
  imageUrl?: string
  source: string
  tags?: string[]
  dietaryRestrictions?: string[]
}

/**
 * Response DTO from the storage service
 */
export interface RecipeResponse {
  id: string
  userId: string
  recipeName?: string
  title: string
  description?: string
  ingredients: string[]
  instructions: string[]
  prepTime?: number
  cookTime?: number
  servings: number
  nutrition?: {
    calories: number
    protein: number
    carbohydrates: number
    fat: number
    fiber: number
    sodium: number
  }
  tips?: Record<string, string[]> // Backend returns Map<String, List<String>>
  imageUrl?: string
  source: string
  tags?: string[]
  dietaryRestrictions?: string[]
  createdAt: string
  updatedAt: string
}

/**
 * Convert AI-generated Recipe to CreateRecipeRequest
 */
const mapRecipeToCreateRequest = (recipe: Recipe): CreateRecipeRequest => {
  // Parse time strings to minutes (e.g., "30 minutes" -> 30)
  const parseTimeToMinutes = (time?: string | number | undefined): number | undefined => {
    if (time === undefined || time === null) return undefined
    // If it's a number, accept only positive values; treat 0 or negatives as undefined
    if (typeof time === 'number') {
      return time > 0 ? Math.floor(time) : undefined
    }
    const timeStr = String(time).trim()
    if (!timeStr) return undefined
    const match = timeStr.match(/(\d+)\s*(minute|min|hour|hr)/i)
    if (match) {
      const value = parseInt(match[1], 10)
      const unit = match[2].toLowerCase()
      return unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value
    }

    // Fallback: try to parse a plain number string
    const num = parseInt(timeStr, 10)
    return isNaN(num) || num <= 0 ? undefined : num
  }

  // Convert tips to Map<String, List<String>> format expected by backend
  const mapTips = (tips?: RecipeTips): Record<string, string | string[]> | undefined => {
    if (!tips) return undefined
    
    const result: Record<string, string | string[]> = {}
    
    if (tips.substitutions) {
      result.substitutions = tips.substitutions
    }
    if (tips.makeAhead) {
      result.makeAhead = tips.makeAhead // Keep as string
    }
    if (tips.storage) {
      result.storage = tips.storage // Keep as string
    }
    if (tips.reheating) {
      result.reheating = tips.reheating // Keep as string
    }
    if (tips.variations) {
      result.variations = tips.variations
    }
    
    return Object.keys(result).length > 0 ? result : undefined
  }

  // Skip imageUrl if it's a base64 data URL (too large for Firestore)
  const imageUrl = recipe.imageUrl?.startsWith('data:') ? undefined : recipe.imageUrl

  return {
    recipeName: recipe.recipeName,
    description: recipe.description,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    prepTimeMinutes: parseTimeToMinutes(recipe.prepTime),
    cookTimeMinutes: parseTimeToMinutes(recipe.cookTime),
    servings: typeof recipe.servings === 'number' ? recipe.servings : (parseInt(String(recipe.servings), 10) || 1),
    nutritionalInfo: recipe.nutritionalInfo,
    tips: mapTips(recipe.tips),
    imageUrl,
    source: recipe.source || 'ai-generated',
    tags: recipe.tags || [],
    dietaryRestrictions: recipe.dietaryRestrictions || []
  }
}

/**
 * Save a recipe to the storage service
 * @param recipe - The AI-generated recipe to save
 * @returns The saved recipe with ID and metadata
 */
export const saveRecipe = async (recipe: Recipe): Promise<RecipeResponse> => {
  const url = buildApiUrl(STORAGE_API_BASE, '/api/recipes')
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
    return response.data
  } else {
    // Normal mode with authentication
    const response = await postWithAuth(url, request)
    return response.data
  }
}

/**
 * Fetch all recipes for the current user
 * @returns List of recipes
 */
export const getRecipes = async (): Promise<RecipeResponse[]> => {
  const url = buildApiUrl(STORAGE_API_BASE, '/api/recipes')
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

  return response.data
}

/**
 * Fetch a single recipe by ID
 * @param id - The recipe ID
 * @returns The recipe
 */
export const getRecipe = async (id: string): Promise<RecipeResponse> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')
  
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(STORAGE_API_BASE, `/api/recipes/${id}`)
  
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  return response.data
}

/**
 * Update an existing recipe
 * @param id - The recipe ID to update
 * @param recipe - The updated recipe data
 * @returns The updated recipe
 */
export const updateRecipe = async (id: string, recipe: Recipe): Promise<RecipeResponse> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')
  
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(STORAGE_API_BASE, `/api/recipes/${id}`)
  
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
  
  return response.data
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
  const url = buildApiUrl(STORAGE_API_BASE, `/api/recipes/${id}`)
  
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

export default {
  saveRecipe,
  getRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe
}

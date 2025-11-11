import { postWithAuth } from '../utils/authApi'
import { buildApiUrl } from '../utils/apiUtils'
import { uploadRecipeImage, deleteRecipeImage } from '../utils/imageStorage'
import type { Recipe, RecipeTips } from '../types/nutrition'

const STORAGE_API_BASE = import.meta.env.VITE_STORAGE_API_URL || ''

/**
 * Request DTO for creating a recipe in the storage service
 */
export interface CreateRecipeRequest {
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
  tips?: Record<string, string[]> // Backend expects Map<String, List<String>>
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
  const parseTimeToMinutes = (timeStr?: string): number | undefined => {
    if (!timeStr) return undefined
    const match = timeStr.match(/(\d+)\s*(minute|min|hour|hr)/i)
    if (!match) return undefined
    const value = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()
    return unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value
  }

  // Convert tips to Map<String, List<String>> format expected by backend
  const mapTips = (tips?: RecipeTips): Record<string, string[]> | undefined => {
    if (!tips) return undefined
    
    const result: Record<string, string[]> = {}
    
    if (tips.substitutions) {
      result.substitutions = tips.substitutions
    }
    if (tips.makeAhead) {
      result.makeAhead = [tips.makeAhead] // Convert string to array
    }
    if (tips.storage) {
      result.storage = [tips.storage] // Convert string to array
    }
    if (tips.reheating) {
      result.reheating = [tips.reheating] // Convert string to array
    }
    if (tips.variations) {
      result.variations = tips.variations
    }
    
    return Object.keys(result).length > 0 ? result : undefined
  }

  // Skip imageUrl if it's a base64 data URL (too large for Firestore)
  const imageUrl = recipe.imageUrl?.startsWith('data:') ? undefined : recipe.imageUrl

  return {
    title: recipe.recipeName,
    description: recipe.description,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    prepTime: parseTimeToMinutes(recipe.prepTime),
    cookTime: parseTimeToMinutes(recipe.cookTime),
    servings: typeof recipe.servings === 'number' ? recipe.servings : (parseInt(String(recipe.servings), 10) || 1),
    nutrition: recipe.nutritionalInfo?.perServing,
    tips: mapTips(recipe.tips),
    imageUrl,
    source: 'ai-generated',
    tags: [],
    dietaryRestrictions: []
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
  
  const response = await postWithAuth(url, request)
  return response.data
}

/**
 * Fetch all recipes for the current user
 * @returns List of recipes
 */
export const getRecipes = async (): Promise<RecipeResponse[]> => {
  const { default: axios } = await import('axios')
  const { auth } = await import('../config/firebase')
  
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()
  const url = buildApiUrl(STORAGE_API_BASE, '/api/recipes')
  
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
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
  deleteRecipe
}

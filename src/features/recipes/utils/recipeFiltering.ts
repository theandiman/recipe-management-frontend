import type { Recipe } from '../../../types/nutrition'

export interface RecipeFilterState {
  dietaryTags: string[]
  maxPrepTime: number | null
  maxCalories: number | null
  includeIngredients: string[]
  excludeIngredients: string[]
}

export const DEFAULT_RECIPE_FILTERS: RecipeFilterState = {
  dietaryTags: [],
  maxPrepTime: null,
  maxCalories: null,
  includeIngredients: [],
  excludeIngredients: [],
}

export const DIETARY_OPTIONS = [
  'Gluten-Free',
  'Keto',
  'Vegan',
  'Vegetarian',
  'Dairy-Free',
  'Low-Carb',
  'Nut-Free',
]

export const PREP_TIME_OPTIONS = [
  { label: '< 15 mins', value: 15 },
  { label: '< 30 mins', value: 30 },
  { label: '< 60 mins', value: 60 },
]

export const CALORIE_OPTIONS = [
  { label: '< 400 kcal', value: 400 },
  { label: '< 600 kcal', value: 600 },
  { label: '< 800 kcal', value: 800 },
]

export const getIngredientString = (ing: unknown): string => {
  if (typeof ing === 'string') return ing
  if (ing && typeof ing === 'object') {
    const obj = ing as { item?: string; name?: string }
    return obj.item || obj.name || JSON.stringify(ing)
  }
  return String(ing || '')
}

export const getRecipeTotalMinutes = (recipe: Recipe): number => {
  if (typeof recipe.prepTimeMinutes === 'number' || typeof recipe.cookTimeMinutes === 'number') {
    return (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)
  }
  if (recipe.totalTimeMinutes && typeof recipe.totalTimeMinutes === 'number') {
    return recipe.totalTimeMinutes
  }
  const parsedPrep = parseInt(String(recipe.prepTime || ''), 10)
  const parsedCook = parseInt(String(recipe.cookTime || ''), 10)
  const total = (isNaN(parsedPrep) ? 0 : parsedPrep) + (isNaN(parsedCook) ? 0 : parsedCook)
  return total > 0 ? total : (isNaN(parsedPrep) ? 0 : parsedPrep)
}

export const getRecipeCalories = (recipe: Recipe): number | null => {
  if (!recipe.nutritionalInfo) return null
  const info = recipe.nutritionalInfo
  if (info.perServing?.calories !== undefined) return info.perServing.calories
  if (info.total?.calories !== undefined) return info.total.calories
  const anyInfo = info as unknown as { calories?: number }
  if (typeof anyInfo.calories === 'number') return anyInfo.calories
  return null
}

export const normalizeTag = (tag: string): string =>
  typeof tag === 'string' ? tag.toLowerCase().replace(/[\s\-_&]+/g, '') : ''

const HIGH_PROTEIN_REGEXP = /\b(?:chicken|turkey|beef|steak|pork|salmon|tuna|shrimp|fish|tofu|tempeh|lentils?|beans|chickpeas?|eggs?|greek yogurt|cottage cheese|protein powder|whey|edamame)\b/i

export const recipeMatchesDietaryTag = (recipe: Recipe, requiredTag: string): boolean => {
  const normReq = normalizeTag(requiredTag)
  if (!normReq) return true

  const recipeTags = recipe.tags || []
  const normRecipeTags = recipeTags.map(normalizeTag)

  // Direct normalized tag match
  if (normRecipeTags.includes(normReq)) return true

  const desc = (recipe.description || '').toLowerCase()
  const title = (recipe.recipeName || '').toLowerCase()
  const ingText = (recipe.ingredients || []).map(i => getIngredientString(i)).join(' ').toLowerCase()
  const fullText = `${title} ${desc} ${recipeTags.join(' ')} ${ingText}`.toLowerCase()

  // 1. Quick & Easy / Quick
  if (normReq === 'quickeasy' || normReq === 'quickandeasy' || normReq === 'quick' || normReq === 'easy') {
    const totalMins = getRecipeTotalMinutes(recipe)
    if (totalMins > 0 && totalMins <= 30) return true
    if (recipe.prepTimeMinutes && recipe.prepTimeMinutes <= 30) return true
    if (normRecipeTags.some(t => t.includes('quick') || t.includes('easy'))) return true
    return false
  }

  // 2. Low-Carb / Keto
  if (normReq === 'lowcarb') {
    if (normRecipeTags.includes('keto')) return true
    const carbs = recipe.nutritionalInfo?.perServing?.carbohydrates ?? recipe.nutritionalInfo?.total?.carbohydrates
    if (typeof carbs === 'number' && carbs <= 20) return true
    if (/\b(?:low[\s-]carb|keto(?:genic)?)\b/i.test(fullText)) return true
    return false
  }
  if (normReq === 'keto') {
    if (normRecipeTags.includes('lowcarb')) return true
    if (/\bketo(?:genic)?\b/i.test(fullText)) return true
    return false
  }

  // 3. High Protein
  if (normReq === 'highprotein' || normReq === 'protein') {
    if (normRecipeTags.some(t => t.includes('protein'))) return true
    const protein = recipe.nutritionalInfo?.perServing?.protein ?? recipe.nutritionalInfo?.total?.protein
    if (typeof protein === 'number' && protein >= 20) return true
    if (HIGH_PROTEIN_REGEXP.test(fullText)) return true
    return false
  }

  // 4. Dairy-Free / Vegetarian / Vegan
  if (normReq === 'dairyfree' && normRecipeTags.includes('vegan')) return true
  if (normReq === 'vegetarian' && normRecipeTags.includes('vegan')) return true

  // 5. Fallback: check explicit mention in title, description, or tags
  const reqLower = requiredTag.toLowerCase()
  if (desc.includes(reqLower) || title.includes(reqLower) || recipeTags.some(t => t.toLowerCase().includes(reqLower))) {
    return true
  }

  return false
}

/**
 * Plain-text search matching across recipe title, description, tags, and ingredients.
 * Deterministic, instant, and case-insensitive. Every whitespace-separated word token
 * must match at least one field in the recipe (AND logic across words).
 */
export const matchesPlainTextSearch = (recipe: Recipe, searchText: string): boolean => {
  const trimmed = searchText.trim().toLowerCase()
  if (!trimmed) return true

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const searchableText = [
    recipe.recipeName || '',
    recipe.description || '',
    ...(recipe.tags || []),
    ...(recipe.ingredients || []).map(i => getIngredientString(i)),
  ].join(' ').toLowerCase()

  return tokens.every(token => searchableText.includes(token))
}

export interface AiMatchScore {
  score: number
  reason: string
}

/**
 * Filters a collection of recipes using:
 * 1. Deterministic plain-text search across title, description, tags, and ingredients.
 * 2. Direct AI service match map (when an AI search prompt has been executed).
 * 3. User manual facet filters (dietary tags, max prep time, max calories, include/exclude ingredients).
 */
export const filterRecipes = (
  recipes: Recipe[],
  filters: RecipeFilterState,
  searchText: string = '',
  aiMatchesMap?: Record<string, AiMatchScore> | null,
  appliedAiPrompt?: string
): Recipe[] => {
  return recipes.filter(recipe => {
    // 1. Plain text search match (instant keyword search across title, description, tags, ingredients)
    if (searchText && !matchesPlainTextSearch(recipe, searchText)) {
      return false
    }

    // 2. Direct AI Service relevance matching
    if (appliedAiPrompt && aiMatchesMap) {
      if (!recipe.id || !aiMatchesMap[recipe.id]) {
        return false
      }
    }

    // 3. Explicit Manual Dietary Tags Match from Filter Drawer
    if (filters.dietaryTags.length > 0) {
      const hasAllDietary = filters.dietaryTags.every(dt => recipeMatchesDietaryTag(recipe, dt))
      if (!hasAllDietary) return false
    }

    // 4. Manual Prep/Cook Time Limit Match from Filter Drawer
    if (filters.maxPrepTime !== null) {
      const timeMinutes = getRecipeTotalMinutes(recipe)
      if (timeMinutes > 0 && timeMinutes > filters.maxPrepTime) {
        return false
      }
    }

    // 5. Manual Calorie Target Match from Filter Drawer
    if (filters.maxCalories !== null) {
      const cals = getRecipeCalories(recipe)
      if (cals !== null && cals > filters.maxCalories) {
        return false
      }
    }

    // 6. Included Ingredients (Must contain all)
    if (filters.includeIngredients.length > 0) {
      const ingredientStrings = (recipe.ingredients || []).map(i => getIngredientString(i).toLowerCase())
      const containsAll = filters.includeIngredients.every(inc =>
        ingredientStrings.some(str => str.includes(inc.toLowerCase()))
      )
      if (!containsAll) return false
    }

    // 7. Excluded Ingredients / Allergens (Must NOT contain any)
    if (filters.excludeIngredients.length > 0) {
      const ingredientStrings = (recipe.ingredients || []).map(i => getIngredientString(i).toLowerCase())
      const containsExcluded = filters.excludeIngredients.some(exc =>
        ingredientStrings.some(str => str.includes(exc.toLowerCase()))
      )
      if (containsExcluded) return false
    }

    return true
  })
}

export const getActiveFilterCount = (filters: RecipeFilterState): number => {
  let count = 0
  count += filters.dietaryTags.length
  if (filters.maxPrepTime !== null) count += 1
  if (filters.maxCalories !== null) count += 1
  count += filters.includeIngredients.length
  count += filters.excludeIngredients.length
  return count
}

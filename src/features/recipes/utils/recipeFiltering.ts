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

const getIngredientString = (ing: unknown): string => {
  if (typeof ing === 'string') return ing
  if (ing && typeof ing === 'object') {
    const obj = ing as { item?: string; name?: string }
    return obj.item || obj.name || JSON.stringify(ing)
  }
  return String(ing || '')
}

const getRecipeTotalMinutes = (recipe: Recipe): number => {
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

const getRecipeCalories = (recipe: Recipe): number | null => {
  if (!recipe.nutritionalInfo) return null
  const info = recipe.nutritionalInfo
  if (info.perServing?.calories !== undefined) return info.perServing.calories
  if (info.total?.calories !== undefined) return info.total.calories
  const anyInfo = info as unknown as { calories?: number }
  if (typeof anyInfo.calories === 'number') return anyInfo.calories
  return null
}

const parseNumericTimeFromQuery = (query: string): number | null => {
  const match = query.match(/(?:under|less than|<|\b)(\d+)\s*(?:mins?|minutes?|m\b)/i)
  return match ? parseInt(match[1], 10) : null
}

const parseNumericCalsFromQuery = (query: string): number | null => {
  const match = query.match(/(?:under|less than|<|\b)(\d+)\s*(?:cals?|calories?|kcal\b)/i)
  return match ? parseInt(match[1], 10) : null
}

const ATTRIBUTE_TAG_MAP: Record<string, string[]> = {
  quick: ['Quick & Easy'],
  easy: ['Quick & Easy'],
  fast: ['Quick & Easy'],
  keto: ['Keto'],
  vegan: ['Vegan'],
  vegetarian: ['Vegetarian'],
  veggie: ['Vegetarian'],
  healthy: ['Healthy', 'Low-Carb', 'Quick & Easy'],
  'low-carb': ['Low-Carb'],
  'lowcarb': ['Low-Carb'],
  'dairy-free': ['Dairy-Free'],
  'gluten-free': ['Gluten-Free'],
}

export const filterRecipes = (
  recipes: Recipe[],
  filters: RecipeFilterState,
  searchText: string = ''
): Recipe[] => {
  const query = searchText.trim().toLowerCase()

  const queryMaxTime = parseNumericTimeFromQuery(query)
  const queryMaxCals = parseNumericCalsFromQuery(query)

  const cleanedText = query
    .replace(/(?:under|less than|<|\b)\d+\s*(?:mins?|minutes?|m\b)/gi, '')
    .replace(/(?:under|less than|<|\b)\d+\s*(?:cals?|calories?|kcal\b)/gi, '')
    .trim()

  const rawTokens = cleanedText ? cleanedText.split(/[\s,]+/).filter(Boolean) : []

  return recipes.filter(recipe => {
    // 1. Check Query Numeric Time limit if present in text
    if (queryMaxTime !== null) {
      const totalMins = getRecipeTotalMinutes(recipe)
      if (totalMins > 0 && totalMins > queryMaxTime) {
        return false
      }
    }

    // 2. Check Query Numeric Calorie limit if present in text
    if (queryMaxCals !== null) {
      const cals = getRecipeCalories(recipe)
      if (cals !== null && cals > queryMaxCals) {
        return false
      }
    }

    // 3. Text Search / Tokenized NLP Match
    if (cleanedText && rawTokens.length > 0) {
      const fullText = [
        recipe.recipeName || '',
        recipe.description || '',
        ...(recipe.tags || []),
        ...(recipe.ingredients || []).map(i => getIngredientString(i)),
      ].join(' ').toLowerCase()

      const exactMatch = fullText.includes(cleanedText)

      if (!exactMatch) {
        const allTokensMatched = rawTokens.every(token => {
          if (fullText.includes(token)) return true

          const mappedTags = ATTRIBUTE_TAG_MAP[token]
          if (mappedTags) {
            const recipeTags = (recipe.tags || []).map(t => t.toLowerCase())
            const hasMappedTag = mappedTags.some(mt => recipeTags.includes(mt.toLowerCase()))
            if (hasMappedTag) return true

            if ((token === 'quick' || token === 'fast' || token === 'easy') && getRecipeTotalMinutes(recipe) <= 30 && getRecipeTotalMinutes(recipe) > 0) {
              return true
            }
          }

          return false
        })

        if (!allTokensMatched) return false
      }
    }

    // 2. Dietary Tags Match (must contain ALL selected dietary tags)
    if (filters.dietaryTags.length > 0) {
      const recipeTags = (recipe.tags || []).map(t => t.toLowerCase())
      const hasAllDietary = filters.dietaryTags.every(dt => 
        recipeTags.includes(dt.toLowerCase())
      )
      if (!hasAllDietary) return false
    }

    // 3. Prep/Cook Time Limit Match
    if (filters.maxPrepTime !== null) {
      const timeMinutes = getRecipeTotalMinutes(recipe)
      if (timeMinutes > 0 && timeMinutes > filters.maxPrepTime) {
        return false
      }
    }

    // 4. Calorie Target Match
    if (filters.maxCalories !== null) {
      const cals = getRecipeCalories(recipe)
      if (cals !== null && cals > filters.maxCalories) {
        return false
      }
    }

    // 5. Included Ingredients (Must contain all)
    if (filters.includeIngredients.length > 0) {
      const ingredientStrings = (recipe.ingredients || []).map(i => getIngredientString(i).toLowerCase())
      const containsAll = filters.includeIngredients.every(inc =>
        ingredientStrings.some(str => str.includes(inc.toLowerCase()))
      )
      if (!containsAll) return false
    }

    // 6. Excluded Ingredients / Allergens (Must NOT contain any)
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

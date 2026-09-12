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

export const parseNumericTimeFromQuery = (query: string): number | null => {
  const match = query.match(/(?:under|less than|within|in|<=|<)?\s*(\d+)\s*(?:mins?|minutes?|m\b)/i)
  return match ? parseInt(match[1], 10) : null
}

export const parseNumericCalsFromQuery = (query: string): number | null => {
  const match = query.match(/(?:under|less than|below|<=|<)?\s*(\d+)\s*(?:cals?|calories?|kcal\b)/i)
  if (match) return parseInt(match[1], 10)
  if (/\blow(?:-|\s+)?cal(?:orie)?s?\b/i.test(query)) return 400
  return null
}

interface DietaryPhrase {
  pattern: RegExp
  tags: string[]
}

const DIETARY_PHRASES: DietaryPhrase[] = [
  { pattern: /\b(?:low[\s-]carb|lowcarb)\b/i, tags: ['Low-Carb', 'Keto'] },
  { pattern: /\bketo(?:genic)?\b/i, tags: ['Keto', 'Low-Carb'] },
  { pattern: /\b(?:gluten[\s-]free|(?:no|without)\s+gluten)\b/i, tags: ['Gluten-Free'] },
  { pattern: /\b(?:dairy[\s-]free|lactose[\s-]free|(?:no|without)\s+dairy)\b/i, tags: ['Dairy-Free'] },
  { pattern: /\b(?:nut[\s-]free|peanut[\s-]free|(?:no|without)\s+nuts?)\b/i, tags: ['Nut-Free'] },
  { pattern: /\bvegan|plant[\s-]based\b/i, tags: ['Vegan'] },
  { pattern: /\bvegetarian|veggie|meatless\b/i, tags: ['Vegetarian'] },
  { pattern: /\bhealthy\b/i, tags: ['Healthy', 'Low-Carb', 'Quick & Easy'] },
  { pattern: /\bquick|fast|speedy|easy\b/i, tags: ['Quick & Easy', 'Quick'] },
]

export const parseDietaryTagsFromQuery = (query: string): string[] => {
  const matchedTags: string[] = []
  for (const { pattern, tags } of DIETARY_PHRASES) {
    if (pattern.test(query)) {
      tags.forEach(t => {
        if (!matchedTags.includes(t)) matchedTags.push(t)
      })
    }
  }
  return matchedTags
}

export const parseExclusionsFromQuery = (query: string): string[] => {
  const exclusions: string[] = []
  const regex = /\b(?:without|no|free from|exclude)\s+([a-z]+)/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(query)) !== null) {
    exclusions.push(match[1].toLowerCase())
  }
  return exclusions
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'and', 'or', 'not', 'show', 'me', 'find', 'get', 'give', 'looking', 'look',
  'want', 'i', 'im', "i'm", 'we', 'some', 'something', 'any', 'recipe',
  'recipes', 'dish', 'dishes', 'meal', 'meals', 'food', 'foods', 'dinner',
  'lunch', 'breakfast', 'supper', 'snack', 'snacks', 'cook', 'cooking',
  'make', 'making', 'good', 'best', 'delicious', 'tasty', 'simple', 'style',
  'kind', 'type', 'please', 'like', 'using', 'idea', 'ideas',
])

const stemToken = (w: string): string => {
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y'
  if (w.endsWith('es') && w.length > 3) {
    if (/(?:[cs]h|[xsz])es$/i.test(w)) return w.slice(0, -2)
    return w.slice(0, -1)
  }
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 2) return w.slice(0, -1)
  return w
}

const extractMeaningfulQueryTokens = (value: string): string[] => {
  let cleanedQuery = value
    .toLowerCase()
    .replace(/(?:under|less than|within|in|below|<=|<)?\s*\d+\s*(?:mins?|minutes?|m|cals?|calories?|kcal)\b/gi, '')
    .replace(/\b(?:without|no|free from|exclude)\s+[a-z]+/gi, '')

  for (const { pattern } of DIETARY_PHRASES) {
    cleanedQuery = cleanedQuery.replace(pattern, '')
  }

  const rawTokens = cleanedQuery.trim().split(/[\s,]+/).filter(Boolean)
  return rawTokens.filter(token => !STOP_WORDS.has(token))
}

const recipeMatchesDietaryTag = (recipe: Recipe, requiredTag: string): boolean => {
  const recipeTags = (recipe.tags || []).map(t => t.toLowerCase())
  const reqLower = requiredTag.toLowerCase()

  if (recipeTags.includes(reqLower)) return true

  // Semantic relationships
  if ((requiredTag === 'Quick & Easy' || requiredTag === 'Quick') && getRecipeTotalMinutes(recipe) <= 30 && getRecipeTotalMinutes(recipe) > 0) {
    return true
  }
  if (requiredTag === 'Low-Carb' && recipeTags.includes('keto')) return true
  if (requiredTag === 'Dairy-Free' && recipeTags.includes('vegan')) return true
  if (requiredTag === 'Vegetarian' && recipeTags.includes('vegan')) return true

  // Check description and title for explicit mention
  const desc = (recipe.description || '').toLowerCase()
  const title = (recipe.recipeName || '').toLowerCase()
  if (desc.includes(reqLower) || title.includes(reqLower)) return true

  return false
}

export interface NlpSearchIntentInput {
  queryKeywords?: string
  dietaryTags?: string[]
  maxPrepTime?: number | null
  maxCalories?: number | null
  explanation?: string
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

/**
 * Evaluates recipe against natural language AI prompt constraints and/or parsed AI intent.
 */
export const matchesAiIntent = (
  recipe: Recipe,
  aiIntent?: NlpSearchIntentInput | null,
  aiPrompt?: string
): boolean => {
  if (!aiIntent && !aiPrompt) return true

  const query = (aiPrompt || '').trim().toLowerCase()

  const queryMaxTime = (query ? parseNumericTimeFromQuery(query) : null) ?? aiIntent?.maxPrepTime ?? null
  const queryMaxCals = (query ? parseNumericCalsFromQuery(query) : null) ?? aiIntent?.maxCalories ?? null

  const queryDietaryGroups: string[][] = []
  if (query) {
    for (const { pattern, tags } of DIETARY_PHRASES) {
      if (pattern.test(query)) {
        queryDietaryGroups.push(tags)
      }
    }
  }
  if (aiIntent?.dietaryTags) {
    aiIntent.dietaryTags.forEach(tag => {
      queryDietaryGroups.push([tag])
    })
  }

  const queryExclusions = query ? parseExclusionsFromQuery(query) : []

  // 1. Check numeric prep time limit
  if (queryMaxTime !== null) {
    const totalMins = getRecipeTotalMinutes(recipe)
    if (totalMins > 0 && totalMins > queryMaxTime) {
      return false
    }
  }

  // 2. Check numeric calorie limit
  if (queryMaxCals !== null) {
    const cals = getRecipeCalories(recipe)
    if (cals !== null && cals > queryMaxCals) {
      return false
    }
  }

  // 3. Check dietary tags (AND logic across groups)
  if (queryDietaryGroups.length > 0) {
    const satisfiesAllGroups = queryDietaryGroups.every(group =>
      group.some(tag => recipeMatchesDietaryTag(recipe, tag))
    )
    if (!satisfiesAllGroups) return false
  }

  // 4. Check negative exclusions
  if (queryExclusions.length > 0) {
    const ingredientStrings = (recipe.ingredients || []).map(i => getIngredientString(i).toLowerCase())
    const desc = (recipe.description || '').toLowerCase()
    const title = (recipe.recipeName || '').toLowerCase()

    const hasExcluded = queryExclusions.some(exc => {
      const stemmed = stemToken(exc)
      const isExcludedText = (text: string) => {
        const pattern = new RegExp(`\\b(?:${exc}|${stemmed})(?!-free\\b|\\s+free\\b)`, 'i')
        return pattern.test(text)
      }
      return (
        ingredientStrings.some(i => isExcludedText(i)) ||
        isExcludedText(title) ||
        isExcludedText(desc)
      )
    })
    if (hasExcluded) return false
  }

  // 5. Check AI query keywords or remaining prompt tokens
  const aiKeywordText = aiIntent?.queryKeywords?.trim() || ''
  const isKeywordFallback =
    aiIntent?.explanation?.toLowerCase().includes('using standard keyword search') ||
    aiKeywordText.toLowerCase() === query
  const kwTokens = extractMeaningfulQueryTokens(
    aiKeywordText && !isKeywordFallback ? aiKeywordText : query,
  )

  if (kwTokens.length > 0) {
    const fullText = [
      recipe.recipeName || '',
      recipe.description || '',
      ...(recipe.tags || []),
      ...(recipe.ingredients || []).map(i => getIngredientString(i)),
    ].join(' ').toLowerCase()

    const matched = kwTokens.every(t => {
      if (fullText.includes(t)) return true
      const stemmed = stemToken(t)
      return stemmed.length > 2 && fullText.includes(stemmed)
    })
    if (!matched) return false
  }

  return true
}

export const filterRecipes = (
  recipes: Recipe[],
  filters: RecipeFilterState,
  searchText: string = '',
  aiIntent?: NlpSearchIntentInput | null,
  aiPrompt?: string
): Recipe[] => {
  return recipes.filter(recipe => {
    // 1. Plain text search match (instant keyword search across title, description, tags, ingredients)
    if (searchText && !matchesPlainTextSearch(recipe, searchText)) {
      return false
    }

    // 2. AI Intent / Prompt match
    if ((aiIntent || aiPrompt) && !matchesAiIntent(recipe, aiIntent, aiPrompt)) {
      return false
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

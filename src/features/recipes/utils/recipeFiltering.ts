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
  'comfort', 'cozy', 'hearty', 'healthy', 'fresh', 'crispy', 'creamy',
  'warm', 'hot', 'cold', 'easy', 'quick', 'fast', 'speedy', 'cheap', 'budget',
  'classic', 'traditional', 'homemade', 'kid', 'friendly', 'kids', 'favorite',
  'favourite', 'great', 'awesome', 'amazing', 'perfect', 'special', 'rich',
  'sweet', 'savory', 'savoury', 'light', 'heavy', 'clean', 'nice', 'craving',
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

export const normalizeTag = (tag: string): string =>
  tag.toLowerCase().replace(/[\s\-_&]+/g, '')

const HIGH_PROTEIN_INDICATORS = [
  'chicken', 'turkey', 'beef', 'steak', 'pork', 'salmon', 'tuna', 'shrimp',
  'fish', 'tofu', 'tempeh', 'lentil', 'lentils', 'beans', 'chickpea', 'chickpeas',
  'egg', 'eggs', 'greek yogurt', 'cottage cheese', 'protein powder', 'whey', 'edamame',
]

const BREAKFAST_INDICATORS = [
  'breakfast', 'brunch', 'pancake', 'pancakes', 'waffle', 'waffles', 'oat', 'oats',
  'oatmeal', 'cereal', 'toast', 'muffin', 'muffins', 'smoothie', 'bacon', 'frittata',
  'omelet', 'omelette', 'bagel', 'crepe', 'crepes', 'granola', 'french toast',
]

const DESSERT_INDICATORS = [
  'dessert', 'cake', 'cookie', 'cookies', 'pie', 'tart', 'sweet', 'chocolate',
  'pudding', 'ice cream', 'brownie', 'brownies', 'cupcake', 'cupcakes', 'pastry',
  'pastries', 'candy', 'fudge', 'cocktail',
]

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
    if (HIGH_PROTEIN_INDICATORS.some(ind => fullText.includes(ind))) return true
    return false
  }

  // 4. Dairy-Free / Vegetarian / Vegan
  if (normReq === 'dairyfree' && normRecipeTags.includes('vegan')) return true
  if (normReq === 'vegetarian' && normRecipeTags.includes('vegan')) return true

  // 5. Meal Types: Dinner / Lunch / Breakfast / Dessert / Snack
  if (normReq === 'dinner' || normReq === 'lunch') {
    if (fullText.includes(normReq)) return true
    // Exclude recipes that are purely sweet desserts or cocktails
    const isPureDessert = normRecipeTags.some(t => ['dessert', 'cake', 'cookie', 'pie', 'sweet', 'baking', 'cocktail'].includes(t)) ||
      /\b(?:cake|cookies?|pie|brownies?|cupcake|ice\s*cream|pudding)\b/i.test(title)
    if (isPureDessert) return false
    // Any savory meal (salad, soup, main, pasta, bread, etc.) matches dinner/lunch
    return true
  }

  if (normReq === 'breakfast' || normReq === 'brunch') {
    if (normRecipeTags.includes('breakfast') || normRecipeTags.includes('brunch')) return true
    if (BREAKFAST_INDICATORS.some(ind => new RegExp(`\\b${ind}\\b`, 'i').test(fullText))) return true
    return false
  }

  if (normReq === 'dessert') {
    if (normRecipeTags.some(t => ['dessert', 'sweet', 'cake', 'cookie', 'pie', 'baking'].includes(t))) return true
    if (DESSERT_INDICATORS.some(ind => new RegExp(`\\b${ind}\\b`, 'i').test(fullText))) return true
    return false
  }

  if (normReq === 'snack') {
    if (normRecipeTags.includes('snack') || normRecipeTags.includes('appetizer')) return true
    if (/\b(?:snack|appetizer|finger\s*food|dip|bites?)\b/i.test(fullText)) return true
    const totalMins = getRecipeTotalMinutes(recipe)
    if (totalMins > 0 && totalMins <= 15) return true
    return false
  }

  // Fallback: check explicit mention in title, description, or tags
  const reqLower = requiredTag.toLowerCase()
  if (desc.includes(reqLower) || title.includes(reqLower) || recipeTags.some(t => t.toLowerCase().includes(reqLower))) {
    return true
  }

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
  const seenNormTags = new Set<string>()

  if (aiIntent?.dietaryTags && aiIntent.dietaryTags.length > 0) {
    aiIntent.dietaryTags.forEach(tag => {
      const norm = normalizeTag(tag)
      if (norm && !seenNormTags.has(norm)) {
        seenNormTags.add(norm)
        queryDietaryGroups.push([tag])
      }
    })
  } else if (query) {
    for (const { pattern, tags } of DIETARY_PHRASES) {
      if (pattern.test(query)) {
        const groupNorms = tags.map(normalizeTag)
        if (!groupNorms.some(n => seenNormTags.has(n))) {
          groupNorms.forEach(n => seenNormTags.add(n))
          queryDietaryGroups.push(tags)
        }
      }
    }
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

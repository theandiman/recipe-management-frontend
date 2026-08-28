import type { Recipe } from '../../../types/nutrition'

export type SortOption = 'relevance' | 'newest' | 'oldest' | 'prepTime' | 'calories' | 'alphabetical' | 'most-liked'

export type ViewMode = 'grid' | 'list'

export const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Most Liked', value: 'most-liked' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Prep Time (Fastest)', value: 'prepTime' },
  { label: 'Calories (Lowest)', value: 'calories' },
  { label: 'Alphabetical (A-Z)', value: 'alphabetical' },
]

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

const getRecipeCalories = (recipe: Recipe): number => {
  if (!recipe.nutritionalInfo) return 9999
  const info = recipe.nutritionalInfo
  if (info.perServing?.calories !== undefined) return info.perServing.calories
  if (info.total?.calories !== undefined) return info.total.calories
  const anyInfo = info as unknown as { calories?: number }
  if (typeof anyInfo.calories === 'number') return anyInfo.calories
  return 9999
}

export const sortRecipes = (recipes: Recipe[], sortOption: SortOption): Recipe[] => {
  const copy = [...recipes]

  switch (sortOption) {
    case 'most-liked':
      return copy.sort((a, b) => {
        const getLikeCount = (r: Recipe) => (r as Recipe & { likeCount?: number }).likeCount ?? 0
        return getLikeCount(b) - getLikeCount(a)
      })
    case 'newest':
      return copy.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })
    case 'oldest':
      return copy.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeA - timeB
      })
    case 'prepTime':
      return copy.sort((a, b) => {
        const timeA = getRecipeTotalMinutes(a)
        const timeB = getRecipeTotalMinutes(b)
        return timeA - timeB
      })
    case 'calories':
      return copy.sort((a, b) => {
        const calA = getRecipeCalories(a)
        const calB = getRecipeCalories(b)
        return calA - calB
      })
    case 'alphabetical':
      return copy.sort((a, b) => (a.recipeName || '').localeCompare(b.recipeName || ''))
    case 'relevance':
    default:
      return copy
  }
}

import { describe, it, expect } from 'vitest'
import {
  filterRecipes,
  getActiveFilterCount,
  DEFAULT_RECIPE_FILTERS,
  type RecipeFilterState,
} from './recipeFiltering'
import type { Recipe } from '../../../types/nutrition'

const sampleRecipes: Recipe[] = [
  {
    id: '1',
    recipeName: 'Keto Avocado Salad',
    description: 'Quick keto salad',
    tags: ['Keto', 'Salad', 'Gluten-Free'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 1,
    instructions: ['Mix ingredients'],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 350 } },
    ingredients: ['1 whole Avocado', '2 cups Spinach'],
  },
  {
    id: '2',
    recipeName: 'Vegan Lentil Soup',
    description: 'Hearty vegan soup',
    tags: ['Vegan', 'Soup', 'Gluten-Free'],
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    servings: 4,
    instructions: ['Boil lentils'],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 550 } },
    ingredients: ['1 cup Lentils', '2 cloves Garlic'],
  },
  {
    id: '3',
    recipeName: 'Cheesy Garlic Bread',
    description: 'Crispy garlic bread',
    tags: ['Vegetarian', 'Quick'],
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 2,
    instructions: ['Bake bread'],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 450 } },
    ingredients: ['1 loaf Bread', '1 cup Cheese', '3 cloves Garlic'],
  },
]

describe('recipeFiltering', () => {
  it('should filter by text search query', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'Salad')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Keto Avocado Salad')
  })

  it('should filter by dietary tags', () => {
    const filters: RecipeFilterState = {
      ...DEFAULT_RECIPE_FILTERS,
      dietaryTags: ['Vegan'],
    }
    const result = filterRecipes(sampleRecipes, filters)
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Vegan Lentil Soup')
  })

  it('should filter by max prep time', () => {
    const filters: RecipeFilterState = {
      ...DEFAULT_RECIPE_FILTERS,
      maxPrepTime: 15,
    }
    const result = filterRecipes(sampleRecipes, filters)
    expect(result.map(r => r.recipeName)).toEqual(['Keto Avocado Salad', 'Cheesy Garlic Bread'])
  })

  it('should filter by max calories', () => {
    const filters: RecipeFilterState = {
      ...DEFAULT_RECIPE_FILTERS,
      maxCalories: 400,
    }
    const result = filterRecipes(sampleRecipes, filters)
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Keto Avocado Salad')
  })

  it('should filter by included and excluded ingredients', () => {
    const filters: RecipeFilterState = {
      ...DEFAULT_RECIPE_FILTERS,
      includeIngredients: ['Garlic'],
      excludeIngredients: ['Bread'],
    }
    const result = filterRecipes(sampleRecipes, filters)
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Vegan Lentil Soup')
  })

  it('should calculate active filter count accurately', () => {
    const filters: RecipeFilterState = {
      dietaryTags: ['Keto', 'Gluten-Free'],
      maxPrepTime: 30,
      maxCalories: 500,
      includeIngredients: ['Avocado'],
      excludeIngredients: [],
    }
    expect(getActiveFilterCount(filters)).toBe(5)
  })

  it('should support tokenized NLP search for attribute words like "quick"', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'quick')
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('should match multi-token search terms across fields in any order', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'garlic bread')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Cheesy Garlic Bread')
  })
})

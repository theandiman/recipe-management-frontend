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

  it('should support plain text search across title, description, tags, and ingredients', () => {
    // Title
    expect(filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'Salad')).toHaveLength(1)
    // Description
    expect(filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'hearty')).toHaveLength(1)
    // Tags
    expect(filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'gluten-free')).toHaveLength(2)
    // Ingredients
    expect(filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'spinach')).toHaveLength(1)
  })

  it('should match multi-token plain text search terms across fields in any order', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'garlic bread')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Cheesy Garlic Bread')
  })

  it('should parse numeric prep time limits from AI prompt without mutating filters', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', null, 'under 15 mins')
    expect(result.map(r => r.recipeName)).toEqual(['Keto Avocado Salad', 'Cheesy Garlic Bread'])
  })

  it('should parse numeric calorie limits from AI prompt without mutating filters', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', null, 'under 400 cals')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Keto Avocado Salad')
  })

  it('should handle natural language queries in AI prompt with conversational intent', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', {
      queryKeywords: 'salad',
      dietaryTags: ['Keto'],
    }, 'show me quick salad for dinner')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Keto Avocado Salad')
  })

  it('should parse multi-word dietary phrases in AI prompt like "low carb"', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', null, 'low carb salad')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Keto Avocado Salad')
  })

  it('should support negative exclusions in AI prompt like "without cheese"', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', null, 'soup without cheese')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Vegan Lentil Soup')
  })

  it('should combine natural language attributes, dietary intent, and time/calorie constraints in AI prompt', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', null, 'quick low-carb salad under 400 cals')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Keto Avocado Salad')
  })

  it('should fall back to cleaned prompt keywords when AI intent uses standard keyword search', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', {
      queryKeywords: 'Quick dinner under 30 mins',
      dietaryTags: [],
      explanation: 'Using standard keyword search.',
    }, 'Quick dinner under 30 mins')
    expect(result.map(r => r.recipeName)).toEqual(['Keto Avocado Salad', 'Cheesy Garlic Bread'])
  })

  it('should require ALL dietary groups to be satisfied in AI prompt (AND logic across groups)', () => {
    // Vegan Lentil Soup is Vegan + Gluten-Free
    // Keto Avocado Salad is Keto + Gluten-Free (NOT Vegan)
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', null, 'vegan gluten free')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Vegan Lentil Soup')
  })

  it('should not exclude recipes when exclusion word in AI prompt is part of a -free compound (e.g. without dairy matches dairy-free)', () => {
    // Vegan Lentil Soup is vegan (so dairy-free)
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', null, 'without dairy')
    expect(result.map(r => r.recipeName)).toContain('Vegan Lentil Soup')
  })

  it('should support excluding allergens in AI prompt like gluten and nuts', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, '', null, 'without gluten')
    // Cheesy Garlic Bread does not have gluten-free tag and is excluded if gluten is present
    expect(result.map(r => r.recipeName)).toEqual(['Keto Avocado Salad', 'Vegan Lentil Soup'])
  })

  it('should support aiIntent parameter seamlessly', () => {
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'soup', {
      dietaryTags: ['Vegan'],
      maxCalories: 600,
    })
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Vegan Lentil Soup')
  })

  it('should combine plain text search with AI prompt seamlessly', () => {
    // AI prompt filters to < 15 mins (Keto Avocado Salad, Cheesy Garlic Bread)
    // Plain text search filters to "salad" -> only Keto Avocado Salad
    const result = filterRecipes(sampleRecipes, DEFAULT_RECIPE_FILTERS, 'salad', null, 'under 15 mins')
    expect(result).toHaveLength(1)
    expect(result[0].recipeName).toBe('Keto Avocado Salad')
  })
})

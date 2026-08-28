import { describe, it, expect } from 'vitest'
import { sortRecipes } from './recipeSorting'
import type { Recipe } from '../../../types/nutrition'

const sampleRecipes: Recipe[] = [
  {
    id: '1',
    recipeName: 'Zucchini Fritters',
    prepTimeMinutes: 20,
    servings: 2,
    ingredients: [],
    instructions: [],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 300 } },
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    recipeName: 'Apple Pie',
    prepTimeMinutes: 45,
    servings: 8,
    ingredients: [],
    instructions: [],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 500 } },
    createdAt: '2026-05-01T00:00:00Z',
  },
  {
    id: '3',
    recipeName: 'Banana Bread',
    prepTimeMinutes: 15,
    servings: 6,
    ingredients: [],
    instructions: [],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 250 } },
    createdAt: '2026-03-01T00:00:00Z',
  },
]

describe('recipeSorting', () => {
  it('should sort alphabetically', () => {
    const result = sortRecipes(sampleRecipes, 'alphabetical')
    expect(result.map(r => r.recipeName)).toEqual(['Apple Pie', 'Banana Bread', 'Zucchini Fritters'])
  })

  it('should sort by prep time fastest first', () => {
    const result = sortRecipes(sampleRecipes, 'prepTime')
    expect(result.map(r => r.recipeName)).toEqual(['Banana Bread', 'Zucchini Fritters', 'Apple Pie'])
  })

  it('should sort by calories lowest first', () => {
    const result = sortRecipes(sampleRecipes, 'calories')
    expect(result.map(r => r.recipeName)).toEqual(['Banana Bread', 'Zucchini Fritters', 'Apple Pie'])
  })

  it('should sort by newest first', () => {
    const result = sortRecipes(sampleRecipes, 'newest')
    expect(result.map(r => r.recipeName)).toEqual(['Apple Pie', 'Banana Bread', 'Zucchini Fritters'])
  })

  it('should sort by oldest first', () => {
    const result = sortRecipes(sampleRecipes, 'oldest')
    expect(result.map(r => r.recipeName)).toEqual(['Zucchini Fritters', 'Banana Bread', 'Apple Pie'])
  })
})

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRecipeValidation } from './useRecipeValidation'

const baseIngredients = [{ quantity: '1', unit: 'cup', item: 'flour' }]
const baseInstructions = ['Mix well']

describe('useRecipeValidation', () => {
  describe('buildRecipeObject', () => {
    it('defaults source to manual when no overrides provided', () => {
      const { result } = renderHook(() => useRecipeValidation())
      const recipe = result.current.buildRecipeObject(
        'Test Recipe', '', '', '', '2', baseIngredients, baseInstructions, [], null
      )
      expect(recipe.source).toBe('manual')
    })

    it('preserves source from overrides instead of defaulting to manual', () => {
      const { result } = renderHook(() => useRecipeValidation())
      const recipe = result.current.buildRecipeObject(
        'Test Recipe', '', '', '', '2', baseIngredients, baseInstructions, [], null,
        undefined, { source: 'ai-generated' }
      )
      expect(recipe.source).toBe('ai-generated')
    })

    it('preserves nutritionalInfo from overrides', () => {
      const { result } = renderHook(() => useRecipeValidation())
      const nutritionalInfo = { perServing: { calories: 350, protein: 10, carbohydrates: 50, fat: 8, fiber: 3 } }
      const recipe = result.current.buildRecipeObject(
        'Test Recipe', '', '', '', '2', baseIngredients, baseInstructions, [], null,
        undefined, { nutritionalInfo }
      )
      expect(recipe.nutritionalInfo).toEqual(nutritionalInfo)
    })

    it('preserves tips from overrides', () => {
      const { result } = renderHook(() => useRecipeValidation())
      const tips = { storage: 'refrigerate', reheating: 'microwave 2 minutes' }
      const recipe = result.current.buildRecipeObject(
        'Test Recipe', '', '', '', '2', baseIngredients, baseInstructions, [], null,
        undefined, { tips }
      )
      expect(recipe.tips).toEqual(tips)
    })

    it('preserves dietaryRestrictions from overrides', () => {
      const { result } = renderHook(() => useRecipeValidation())
      const recipe = result.current.buildRecipeObject(
        'Test Recipe', '', '', '', '2', baseIngredients, baseInstructions, [], null,
        ['vegan', 'gluten-free']
      )
      expect(recipe.dietaryRestrictions).toEqual(['vegan', 'gluten-free'])
    })

    it('preserves all AI metadata fields in a combined overrides object', () => {
      const { result } = renderHook(() => useRecipeValidation())
      const nutritionalInfo = { perServing: { calories: 200, protein: 5, carbohydrates: 30, fat: 4, fiber: 2 } }
      const tips = { storage: 'freeze up to 3 months' }
      const recipe = result.current.buildRecipeObject(
        'AI Recipe', 'An AI dish', '10', '20', '4', baseIngredients, baseInstructions, ['vegan'], null,
        ['vegan'],
        {
          source: 'ai-generated',
          nutritionalInfo,
          tips,
        }
      )
      expect(recipe.source).toBe('ai-generated')
      expect(recipe.nutritionalInfo).toEqual(nutritionalInfo)
      expect(recipe.tips).toEqual(tips)
      expect(recipe.dietaryRestrictions).toEqual(['vegan'])
    })
  })
})

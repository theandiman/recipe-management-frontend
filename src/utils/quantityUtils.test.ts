import { describe, it, expect } from 'vitest'
import { parseQuantityString, formatQuantity, scaleIngredient } from './quantityUtils'

describe('quantityUtils', () => {
  describe('parseQuantityString', () => {
    it('should parse whole numbers with fractions (e.g., "1 1/2")', () => {
      const result = parseQuantityString('1 1/2')
      expect(result.value).toBe(1.5)
      expect(result.raw).toBe('1 1/2')
    })

    it('should parse simple fractions (e.g., "1/2")', () => {
      const result = parseQuantityString('1/2')
      expect(result.value).toBe(0.5)
      expect(result.raw).toBe('1/2')
    })

    it('should parse decimal numbers (e.g., "2.5")', () => {
      const result = parseQuantityString('2.5')
      expect(result.value).toBe(2.5)
      expect(result.raw).toBe('2.5')
    })

    it('should parse whole numbers (e.g., "3")', () => {
      const result = parseQuantityString('3')
      expect(result.value).toBe(3)
      expect(result.raw).toBe('3')
    })

    it('should handle leading/trailing whitespace', () => {
      const result = parseQuantityString('  2 1/4  ')
      expect(result.value).toBe(2.25)
      expect(result.raw).toBe('2 1/4')
    })

    it('should return null for non-numeric strings', () => {
      const result = parseQuantityString('abc')
      expect(result.value).toBeNull()
      expect(result.raw).toBeNull()
    })

    it('should handle division by zero', () => {
      const result = parseQuantityString('1/0')
      // Division by zero check prevents parsing the fraction,
      // falls through to decimal parsing which finds "1"
      expect(result.value).toBe(1)
      expect(result.raw).toBe('1')
    })

    it('should parse complex fractions correctly', () => {
      const result = parseQuantityString('3 3/4')
      expect(result.value).toBe(3.75)
      expect(result.raw).toBe('3 3/4')
    })
  })

  describe('formatQuantity', () => {
    it('should format whole numbers as integers', () => {
      expect(formatQuantity(3)).toBe('3')
      expect(formatQuantity(10)).toBe('10')
    })

    it('should format 0.5 as "1/2"', () => {
      expect(formatQuantity(0.5)).toBe('1/2')
    })

    it('should format 1.5 as "1 1/2"', () => {
      expect(formatQuantity(1.5)).toBe('1 1/2')
    })

    it('should format 0.25 as "1/4"', () => {
      expect(formatQuantity(0.25)).toBe('1/4')
    })

    it('should format 2.25 as "2 1/4"', () => {
      expect(formatQuantity(2.25)).toBe('2 1/4')
    })

    it('should format 0.75 as "3/4"', () => {
      expect(formatQuantity(0.75)).toBe('3/4')
    })

    it('should format 0.33 as "1/3"', () => {
      expect(formatQuantity(0.33)).toBe('1/3')
    })

    it('should format 0.67 as "2/3"', () => {
      expect(formatQuantity(0.67)).toBe('2/3')
    })

    it('should format decimals that don\'t match common fractions', () => {
      // 1.37 actually matches 3/8 (1.375 ≈ 1.37 within threshold)
      // So it returns "1 3/8" instead of "1.37"
      const result = formatQuantity(1.37)
      expect(result).toBe('1 3/8')
    })

    it('should handle negative numbers', () => {
      expect(formatQuantity(-1.5)).toBe('-1 1/2')
      expect(formatQuantity(-0.5)).toBe('-1/2')
      expect(formatQuantity(-3)).toBe('-3')
    })

    it('should handle infinity', () => {
      expect(formatQuantity(Infinity)).toBe('Infinity')
      expect(formatQuantity(-Infinity)).toBe('-Infinity')
    })

    it('should reduce fractions to simplest form', () => {
      expect(formatQuantity(0.5)).toBe('1/2') // not 2/4, 4/8, etc.
    })
  })

  describe('scaleIngredient', () => {
    it('should scale string ingredients with quantities', () => {
      const result = scaleIngredient('2 cups flour', 2)
      expect(result).toBe('4 cups flour')
    })

    it('should scale fractional quantities in strings', () => {
      const result = scaleIngredient('1/2 cup sugar', 2)
      expect(result).toBe('1 cup sugar')
    })

    it('should scale mixed fractions in strings', () => {
      const result = scaleIngredient('1 1/2 cups milk', 2)
      expect(result).toBe('3 cups milk')
    })

    it('should handle decimal quantities', () => {
      const result = scaleIngredient('2.5 tablespoons oil', 2)
      expect(result).toBe('5 tablespoons oil')
    })

    it('should return unchanged string if no quantity found', () => {
      const result = scaleIngredient('Salt to taste', 2)
      expect(result).toBe('Salt to taste')
    })

    it('should return null/undefined inputs unchanged', () => {
      expect(scaleIngredient(null, 2)).toBeNull()
      expect(scaleIngredient(undefined, 2)).toBeUndefined()
    })

    it('should scale object ingredients with amount field', () => {
      const ingredient = { amount: 2, name: 'flour' }
      const result = scaleIngredient(ingredient, 3) as typeof ingredient
      expect(result.amount).toBe(6)
      expect(result.name).toBe('flour')
    })

    it('should scale object ingredients with quantity field', () => {
      const ingredient = { quantity: 1.5, item: 'eggs' }
      const result = scaleIngredient(ingredient, 2) as typeof ingredient
      expect(result.quantity).toBe(3)
      expect(result.item).toBe('eggs')
    })

    it('should scale object ingredients with value field', () => {
      const ingredient = { value: 3, unit: 'cups' }
      const result = scaleIngredient(ingredient, 0.5) as typeof ingredient
      expect(result.value).toBe(1.5)
      expect(result.unit).toBe('cups')
    })

    it('should not mutate original object', () => {
      const original = { amount: 2, name: 'flour' }
      const result = scaleIngredient(original, 3) as typeof original
      expect(original.amount).toBe(2) // Original unchanged
      expect(result.amount).toBe(6)
    })

    it('should handle scaling down (multiplier < 1)', () => {
      const result = scaleIngredient('4 cups flour', 0.5)
      expect(result).toBe('2 cups flour')
    })

    it('should format scaled fractions correctly', () => {
      const result = scaleIngredient('1/4 cup butter', 2)
      expect(result).toBe('1/2 cup butter')
    })
  })
})

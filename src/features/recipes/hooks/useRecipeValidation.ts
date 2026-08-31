import { useCallback, useMemo } from 'react'
import type { Ingredient } from '../../../types/nutrition'
import type { Recipe } from '../../../types/nutrition'

interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  errorSteps: Set<number>
}

export function useRecipeValidation() {
  const validateForm = useCallback((
    title: string,
    ingredients: Ingredient[],
    instructions: string[]
  ): ValidationResult => {
    const errors: Record<string, string> = {}
    const errorSteps = new Set<number>()

    if (!title.trim()) {
      errors.title = 'Recipe name is required'
      errorSteps.add(1)
    }

    const hasValidIngredient = ingredients.some(ing => ing.item.trim())
    if (!hasValidIngredient) {
      errors.ingredients = 'At least one ingredient is required'
      errorSteps.add(2)
    }

    const hasValidInstruction = instructions.some(inst => inst.trim())
    if (!hasValidInstruction) {
      errors.instructions = 'At least one instruction is required'
      errorSteps.add(3)
    }

    return { isValid: Object.keys(errors).length === 0, errors, errorSteps }
  }, [])

  const buildRecipeObject = useCallback((
    title: string,
    description: string,
    prepTime: string,
    cookTime: string,
    servings: string,
    ingredients: Ingredient[],
    instructions: string[],
    tags: string[],
    imagePreview: string | null,
    dietaryRestrictions?: string[],
    tipsOrOverrides?: {
      storageInstructions?: string
      makeAheadTips?: string
      reheatingInstructions?: string
      substitutions?: string[]
      variations?: string[]
      [key: string]: unknown
    },
    overrides?: Partial<Recipe>
  ): Recipe => {
    const ingredientStrings = ingredients
      .filter(ing => ing.item.trim())
      .map(ing => `${ing.quantity} ${ing.unit} ${ing.item}`.trim())

    const validInstructions = instructions.filter(inst => inst.trim())

    let tips = tipsOrOverrides
    let actualOverrides = overrides

    if (tipsOrOverrides && ('source' in tipsOrOverrides || 'nutritionalInfo' in tipsOrOverrides || 'id' in tipsOrOverrides || 'tips' in tipsOrOverrides)) {
      actualOverrides = { ...tipsOrOverrides, ...overrides } as Partial<Recipe>
    }

    const rawStorage = tips?.storageInstructions?.trim()
    const rawMakeAhead = tips?.makeAheadTips?.trim()
    const rawReheating = tips?.reheatingInstructions?.trim()
    const rawSubs = tips?.substitutions?.filter(s => s.trim())
    const rawVars = tips?.variations?.filter(v => v.trim())

    const tipsObj = {
      storage: rawStorage || undefined,
      storageInstructions: rawStorage || undefined,
      makeAhead: rawMakeAhead || undefined,
      makeAheadTips: rawMakeAhead || undefined,
      reheating: rawReheating || undefined,
      reheatingInstructions: rawReheating || undefined,
      substitutions: rawSubs && rawSubs.length > 0 ? rawSubs : undefined,
      variations: rawVars && rawVars.length > 0 ? rawVars : undefined,
      ...actualOverrides?.tips
    }

    const hasTips = Boolean(
      tipsObj.storage || tipsObj.makeAhead || tipsObj.reheating ||
      (tipsObj.substitutions && tipsObj.substitutions.length > 0) ||
      (tipsObj.variations && tipsObj.variations.length > 0)
    )

    return {
      source: 'manual' as const,
      recipeName: title.trim(),
      description: description.trim() || undefined,
      ingredients: ingredientStrings,
      instructions: validInstructions,
      prepTime: prepTime ? `${prepTime} minutes` : undefined,
      cookTime: cookTime ? `${cookTime} minutes` : undefined,
      servings: servings ? parseInt(servings, 10) : 1,
      tags: tags.length > 0 ? tags : undefined,
      dietaryRestrictions: dietaryRestrictions && dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
      imageUrl: imagePreview || undefined,
      ...(hasTips ? { tips: tipsObj } : {}),
      ...actualOverrides
    }
  }, [])

  return useMemo(() => ({
    validateForm,
    buildRecipeObject
  }), [validateForm, buildRecipeObject])
}

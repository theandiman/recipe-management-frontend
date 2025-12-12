import { useCallback } from 'react'
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
    imagePreview: string | null
  ): Recipe => {
    const ingredientStrings = ingredients
      .filter(ing => ing.item.trim())
      .map(ing => `${ing.quantity} ${ing.unit} ${ing.item}`.trim())

    const validInstructions = instructions.filter(inst => inst.trim())

    return {
      recipeName: title.trim(),
      description: description.trim(),
      ingredients: ingredientStrings,
      instructions: validInstructions,
      prepTime: prepTime || undefined,
      cookTime: cookTime || undefined,
      servings: servings ? parseInt(servings, 10) : 0,
      tags: tags.length > 0 ? tags : undefined,
      imageUrl: imagePreview || undefined,
      source: 'manual' as const
    }
  }, [])

  return {
    validateForm,
    buildRecipeObject
  }
}

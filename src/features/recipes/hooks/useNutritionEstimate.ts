import { useState, useCallback } from 'react'
import { buildApiUrl } from '../../../utils/apiUtils'
import { resolveAiApiBase } from '../../../utils/aiApi'
import { postWithAuth } from '../../../utils/authApi'
import type { Ingredient, NutritionalInfo, NutritionValues } from '../../../types/nutrition'

export interface NutrientValue {
  value: number
  unit: string
  estimated: boolean
}

export interface NutritionEstimate {
  calories: NutrientValue
  protein: NutrientValue
  carbs: NutrientValue
  fat: NutrientValue
  fiber: NutrientValue
  warnings: string[]
  isPartial: boolean
}

export interface NutritionEstimateResponse {
  perServing: NutritionEstimate
  wholeRecipe: NutritionEstimate
}

const mapNutritionValues = (estimate: NutritionEstimate): NutritionValues => ({
  calories: estimate.calories.value,
  protein: estimate.protein.value,
  carbohydrates: estimate.carbs.value,
  fat: estimate.fat.value,
  fiber: estimate.fiber.value,
})

export const mapEstimateToNutritionalInfo = (
  estimate: NutritionEstimateResponse
): NutritionalInfo => ({
  perServing: mapNutritionValues(estimate.perServing),
  total: mapNutritionValues(estimate.wholeRecipe),
})

export type NutritionLoadingState = 'idle' | 'loading' | 'success' | 'error'

interface UseNutritionEstimateReturn {
  estimate: NutritionEstimateResponse | null
  loadingState: NutritionLoadingState
  error: string | null
  estimateNutrition: (ingredients: Ingredient[], servings: number, recipeName?: string) => Promise<void>
  clearEstimate: () => void
  acceptEstimate: (onAccept: (estimate: NutritionEstimateResponse) => void) => void
}

/**
 * Manages the nutrition estimation lifecycle.
 *
 * BDD Scenarios covered:
 *   Scenario 1: Happy path — all ingredients known, full estimate returned
 *   Scenario 2: Partial estimate — some ingredients unknown, warnings shown
 *   Scenario 3: Empty ingredients — no request made, stays idle
 *   Scenario 4: API failure — error state set, non-blocking warning shown
 */
export function useNutritionEstimate(): UseNutritionEstimateReturn {
  const [estimate, setEstimate] = useState<NutritionEstimateResponse | null>(null)
  const [loadingState, setLoadingState] = useState<NutritionLoadingState>('idle')
  const [error, setError] = useState<string | null>(null)

  const estimateNutrition = useCallback(
    async (ingredients: Ingredient[], servings: number, recipeName?: string) => {
      const filledIngredients = ingredients.filter((i) => i.item.trim())
      if (!filledIngredients.length) return

      setLoadingState('loading')
      setError(null)

      try {
        const apiBase = resolveAiApiBase()
        const url = buildApiUrl(apiBase, '/api/recipes/estimate-nutrition')
        const ingredientStrings = filledIngredients.map((i) => {
          const parts = [i.quantity, i.unit, i.item].filter(Boolean).join(' ')
          return parts.trim()
        })
        const res = await postWithAuth(url, {
          ingredients: ingredientStrings,
          servings: servings > 0 ? servings : 1,
          recipeName: recipeName ?? null,
        })
        const data = res.data as NutritionEstimateResponse
        setEstimate(data)
        setLoadingState('success')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not estimate nutrition'
        setError(msg)
        setLoadingState('error')
        console.warn('[NutritionEstimate] estimateNutrition failed:', msg)
      }
    },
    []
  )

  const clearEstimate = useCallback(() => {
    setEstimate(null)
    setLoadingState('idle')
    setError(null)
  }, [])

  const acceptEstimate = useCallback(
    (onAccept: (estimate: NutritionEstimateResponse) => void) => {
      if (estimate) {
        onAccept(estimate)
        setEstimate(null)
        setLoadingState('idle')
      }
    },
    [estimate]
  )

  return {
    estimate,
    loadingState,
    error,
    estimateNutrition,
    clearEstimate,
    acceptEstimate,
  }
}

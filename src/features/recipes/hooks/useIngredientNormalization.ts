import { useState, useCallback } from 'react'
import { buildApiUrl } from '../../../utils/apiUtils'
import { postWithAuth } from '../../../utils/authApi'
import type { Ingredient } from '../../../types/nutrition'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IngredientNormalization {
  index: number
  original: string
  normalized: string
  reason: string
  confidence: number
}

export type NormalizationStatus = 'pending' | 'applied' | 'dismissed'

export interface NormalizationState {
  original: string
  normalized: string
  reason: string
  confidence: number
  status: NormalizationStatus
}

export type NormalizationLoadingState = 'idle' | 'loading' | 'success' | 'error'

interface UseIngredientNormalizationReturn {
  normalizationStates: Map<number, NormalizationState>
  loadingState: NormalizationLoadingState
  error: string | null
  normalizeAll: (ingredients: Ingredient[], recipeName?: string) => Promise<void>
  applyNormalization: (index: number) => void
  dismissNormalization: (index: number) => void
  hasPendingNormalizations: boolean
  clearNormalizations: () => void
}

/**
 * Manages the AI ingredient normalization lifecycle.
 *
 * BDD Scenarios:
 *   Scenario 1: Ambiguous ingredients → pending suggestions shown inline per-ingredient
 *   Scenario 2: User applies suggestion → ingredient updated, suggestion marked 'applied'
 *   Scenario 3: User dismisses suggestion → suggestion hidden, ingredient unchanged
 *   Scenario 4: API failure → error state set, form stays editable (graceful)
 *   Scenario 5: All clear ingredients → no suggestions shown
 */
export function useIngredientNormalization(
  updateIngredient: (index: number, field: keyof Ingredient, value: string) => void
): UseIngredientNormalizationReturn {
  const [normalizationStates, setNormalizationStates] = useState<Map<number, NormalizationState>>(
    new Map()
  )
  const [loadingState, setLoadingState] = useState<NormalizationLoadingState>('idle')
  const [error, setError] = useState<string | null>(null)

  const ingredientToString = (ing: Ingredient): string => {
    const parts = [ing.quantity, ing.unit, ing.item].filter(Boolean)
    return parts.join(' ')
  }

  const callNormalizeApi = useCallback(
    async (
      ingredients: Ingredient[],
      recipeName?: string
    ): Promise<IngredientNormalization[]> => {
      const apiBase = import.meta.env.VITE_AI_API_URL || import.meta.env.VITE_API_URL || ''
      const url = buildApiUrl(apiBase, '/api/recipes/normalize-ingredients')
      const ingredientStrings = ingredients.map(ingredientToString)
      const res = await postWithAuth(url, {
        ingredients: ingredientStrings,
        recipeName: recipeName ?? null,
      })
      const data = res.data as { normalizations: IngredientNormalization[] }
      return data?.normalizations ?? []
    },
    []
  )

  const normalizeAll = useCallback(
    async (ingredients: Ingredient[], recipeName?: string) => {
      if (!ingredients.length) return
      setLoadingState('loading')
      setError(null)
      try {
        const normalizations = await callNormalizeApi(ingredients, recipeName)
        setNormalizationStates((prev) => {
          const next = new Map(prev)
          for (const n of normalizations) {
            next.set(n.index, {
              original: n.original,
              normalized: n.normalized,
              reason: n.reason,
              confidence: n.confidence,
              status: 'pending',
            })
          }
          return next
        })
        setLoadingState('success')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Normalization unavailable'
        setError(msg)
        setLoadingState('error')
        console.warn('[IngredientNormalization] normalizeAll failed:', msg)
      }
    },
    [callNormalizeApi]
  )

  const applyNormalization = useCallback(
    (index: number) => {
      const state = normalizationStates.get(index)
      if (!state || state.status !== 'pending') return

      // Apply: set item field to the full normalized string. The normalized
      // text from Gemini is a full ingredient line (e.g. "1/4 tsp fine sea salt").
      // We put the entire normalized text in the 'item' field and clear quantity/unit
      // to avoid duplication, since the normalized value may embed them.
      updateIngredient(index, 'item', state.normalized)
      updateIngredient(index, 'quantity', '')
      updateIngredient(index, 'unit', '')

      setNormalizationStates((prev) => {
        const next = new Map(prev)
        next.set(index, { ...state, status: 'applied' })
        return next
      })
    },
    [normalizationStates, updateIngredient]
  )

  const dismissNormalization = useCallback(
    (index: number) => {
      setNormalizationStates((prev) => {
        const next = new Map(prev)
        const state = next.get(index)
        if (state) {
          next.set(index, { ...state, status: 'dismissed' })
        }
        return next
      })
    },
    []
  )

  const clearNormalizations = useCallback(() => {
    setNormalizationStates(new Map())
    setLoadingState('idle')
    setError(null)
  }, [])

  const hasPendingNormalizations = [...normalizationStates.values()].some(
    (s) => s.status === 'pending'
  )

  return {
    normalizationStates,
    loadingState,
    error,
    normalizeAll,
    applyNormalization,
    dismissNormalization,
    hasPendingNormalizations,
    clearNormalizations,
  }
}

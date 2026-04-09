import { useState, useCallback } from 'react'
import { buildApiUrl } from '../../../utils/apiUtils'
import { postWithAuth } from '../../../utils/authApi'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstructionRefinement {
  stepIndex: number
  original: string
  refined: string
  changesSummary: string
}

export type StepRefinementStatus = 'pending' | 'accepted' | 'rejected'

export interface StepRefinementState {
  original: string
  refined: string
  changesSummary: string
  status: StepRefinementStatus
}

export type RefinementLoadingState = 'idle' | 'loading' | 'success' | 'error'

interface UseInstructionRefinementReturn {
  stepStates: Map<number, StepRefinementState>
  loadingState: RefinementLoadingState
  error: string | null
  refineAll: (instructions: string[], recipeName?: string) => Promise<void>
  refineSingle: (index: number, instruction: string, recipeName?: string) => Promise<void>
  acceptStep: (index: number) => void
  rejectStep: (index: number) => void
  acceptAll: () => void
  rejectAll: () => void
  hasPendingRefinements: boolean
  clearRefinements: () => void
}

/**
 * Manages the AI instruction refinement lifecycle.
 *
 * BDD Scenarios covered:
 *   Scenario 1: Single step refinement — refineSingle sends one step
 *   Scenario 2: Full set refinement — refineAll sends all steps
 *   Scenario 4: AI failure graceful fallback — error state set, form stays editable
 *   Scenario 5: Reject all keeps originals — rejectAll, no form state mutation
 */
export function useInstructionRefinement(
  updateInstruction: (index: number, value: string) => void
): UseInstructionRefinementReturn {
  const [stepStates, setStepStates] = useState<Map<number, StepRefinementState>>(new Map())
  const [loadingState, setLoadingState] = useState<RefinementLoadingState>('idle')
  const [error, setError] = useState<string | null>(null)

  const callRefineApi = useCallback(
    async (instructions: string[], recipeName?: string): Promise<InstructionRefinement[]> => {
      const apiBase = import.meta.env.VITE_AI_API_URL || import.meta.env.VITE_API_URL || ''
      const url = buildApiUrl(apiBase, '/api/recipes/refine-instructions')
      const res = await postWithAuth(url, { instructions, recipeName: recipeName ?? null })
      const data = res.data as { refinements: InstructionRefinement[] }
      return data?.refinements ?? []
    },
    []
  )

  const applyRefinements = useCallback(
    (refinements: InstructionRefinement[], allInstructions: string[]) => {
      setStepStates((prev) => {
        const next = new Map(prev)
        for (const r of refinements) {
          if (r.refined && r.refined !== allInstructions[r.stepIndex]) {
            next.set(r.stepIndex, {
              original: r.original,
              refined: r.refined,
              changesSummary: r.changesSummary,
              status: 'pending',
            })
          }
        }
        return next
      })
    },
    []
  )

  const refineAll = useCallback(
    async (instructions: string[], recipeName?: string) => {
      if (!instructions.length) return
      setLoadingState('loading')
      setError(null)
      try {
        const refinements = await callRefineApi(instructions, recipeName)
        applyRefinements(refinements, instructions)
        setLoadingState('success')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Refinement unavailable'
        setError(msg)
        setLoadingState('error')
        console.warn('[InstructionRefinement] refineAll failed:', msg)
      }
    },
    [callRefineApi, applyRefinements]
  )

  const refineSingle = useCallback(
    async (index: number, instruction: string, recipeName?: string) => {
      setLoadingState('loading')
      setError(null)
      try {
        const refinements = await callRefineApi([instruction], recipeName)
        const remapped = refinements.map((r) => ({ ...r, stepIndex: index }))
        applyRefinements(remapped, [instruction])
        setLoadingState('success')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Refinement unavailable'
        setError(msg)
        setLoadingState('error')
        console.warn('[InstructionRefinement] refineSingle failed:', msg)
      }
    },
    [callRefineApi, applyRefinements]
  )

  const acceptStep = useCallback(
    (index: number) => {
      const state = stepStates.get(index)
      if (!state || state.status !== 'pending') return
      updateInstruction(index, state.refined)
      setStepStates((prev) => {
        const next = new Map(prev)
        next.set(index, { ...state, status: 'accepted' })
        return next
      })
    },
    [stepStates, updateInstruction]
  )

  const rejectStep = useCallback(
    (index: number) => {
      const state = stepStates.get(index)
      if (!state) return
      setStepStates((prev) => {
        const next = new Map(prev)
        next.set(index, { ...state, status: 'rejected' })
        return next
      })
    },
    [stepStates]
  )

  const acceptAll = useCallback(() => {
    setStepStates((prev) => {
      const next = new Map(prev)
      for (const [idx, state] of next) {
        if (state.status === 'pending') {
          updateInstruction(idx, state.refined)
          next.set(idx, { ...state, status: 'accepted' })
        }
      }
      return next
    })
  }, [updateInstruction])

  const rejectAll = useCallback(() => {
    setStepStates((prev) => {
      const next = new Map(prev)
      for (const [idx, state] of next) {
        if (state.status === 'pending') {
          next.set(idx, { ...state, status: 'rejected' })
        }
      }
      return next
    })
  }, [])

  const clearRefinements = useCallback(() => {
    setStepStates(new Map())
    setLoadingState('idle')
    setError(null)
  }, [])

  const hasPendingRefinements = [...stepStates.values()].some((s) => s.status === 'pending')

  return {
    stepStates,
    loadingState,
    error,
    refineAll,
    refineSingle,
    acceptStep,
    rejectStep,
    acceptAll,
    rejectAll,
    hasPendingRefinements,
    clearRefinements,
  }
}

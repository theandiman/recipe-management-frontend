import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNutritionEstimate } from '../useNutritionEstimate'

vi.mock('../../../../utils/authApi', () => ({
  postWithAuth: vi.fn(),
}))
vi.mock('../../../../utils/apiUtils', () => ({
  buildApiUrl: (_base: string, endpoint: string) => endpoint,
}))

import { postWithAuth } from '../../../../utils/authApi'

const mockPostWithAuth = vi.mocked(postWithAuth)

const makeIngredient = (item: string, quantity = '1', unit = 'cup') => ({ item, quantity, unit })

const happyResponse = {
  perServing: {
    calories: { value: 350, unit: 'kcal', estimated: false },
    protein:  { value: 12, unit: 'g', estimated: false },
    carbs:    { value: 45, unit: 'g', estimated: false },
    fat:      { value: 10, unit: 'g', estimated: false },
    fiber:    { value: 4, unit: 'g', estimated: false },
    warnings: [],
    isPartial: false,
  },
  wholeRecipe: {
    calories: { value: 700, unit: 'kcal', estimated: false },
    protein:  { value: 24, unit: 'g', estimated: false },
    carbs:    { value: 90, unit: 'g', estimated: false },
    fat:      { value: 20, unit: 'g', estimated: false },
    fiber:    { value: 8, unit: 'g', estimated: false },
    warnings: [],
    isPartial: false,
  },
}

describe('useNutritionEstimate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in idle state with no estimate', () => {
    const { result } = renderHook(() => useNutritionEstimate())
    expect(result.current.loadingState).toBe('idle')
    expect(result.current.estimate).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('transitions to loading then success with full estimate', async () => {
    mockPostWithAuth.mockResolvedValueOnce({ data: happyResponse } as any)
    const { result } = renderHook(() => useNutritionEstimate())

    act(() => {
      result.current.estimateNutrition(
        [makeIngredient('flour'), makeIngredient('sugar')],
        2,
        'Cake'
      )
    })

    expect(result.current.loadingState).toBe('loading')

    await waitFor(() => {
      expect(result.current.loadingState).toBe('success')
    })

    expect(result.current.estimate).not.toBeNull()
    expect(result.current.estimate?.perServing.calories.value).toBe(350)
    expect(result.current.estimate?.wholeRecipe.calories.value).toBe(700)
  })

  it('returns partial estimate with warnings for unknown ingredients', async () => {
    const partialResponse = {
      perServing: {
        ...happyResponse.perServing,
        warnings: ["Unknown ingredient: 'mystery powder'"],
        isPartial: true,
      },
      wholeRecipe: {
        ...happyResponse.wholeRecipe,
        warnings: ["Unknown ingredient: 'mystery powder'"],
        isPartial: true,
      },
    }
    mockPostWithAuth.mockResolvedValueOnce({ data: partialResponse } as any)
    const { result } = renderHook(() => useNutritionEstimate())

    await act(async () => {
      await result.current.estimateNutrition(
        [makeIngredient('flour'), makeIngredient('mystery powder', '2', 'tsp')],
        2
      )
    })

    expect(result.current.loadingState).toBe('success')
    expect(result.current.estimate?.perServing.isPartial).toBe(true)
    expect(result.current.estimate?.perServing.warnings).toHaveLength(1)
  })

  it('does not call API when all ingredients are empty', async () => {
    const { result } = renderHook(() => useNutritionEstimate())

    await act(async () => {
      await result.current.estimateNutrition([makeIngredient('')], 2)
    })

    expect(mockPostWithAuth).not.toHaveBeenCalled()
    expect(result.current.loadingState).toBe('idle')
  })

  it('transitions to error state on API failure', async () => {
    mockPostWithAuth.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useNutritionEstimate())

    await act(async () => {
      await result.current.estimateNutrition([makeIngredient('flour')], 2)
    })

    expect(result.current.loadingState).toBe('error')
    expect(result.current.error).toBe('Network error')
  })

  it('clearEstimate resets to idle', async () => {
    mockPostWithAuth.mockResolvedValueOnce({ data: happyResponse } as any)
    const { result } = renderHook(() => useNutritionEstimate())

    await act(async () => {
      await result.current.estimateNutrition([makeIngredient('flour')], 2)
    })

    act(() => {
      result.current.clearEstimate()
    })

    expect(result.current.loadingState).toBe('idle')
    expect(result.current.estimate).toBeNull()
  })

  it('acceptEstimate calls onAccept callback and clears estimate', async () => {
    mockPostWithAuth.mockResolvedValueOnce({ data: happyResponse } as any)
    const { result } = renderHook(() => useNutritionEstimate())

    await act(async () => {
      await result.current.estimateNutrition([makeIngredient('flour')], 2)
    })

    const onAccept = vi.fn()
    act(() => {
      result.current.acceptEstimate(onAccept)
    })

    expect(onAccept).toHaveBeenCalledWith(happyResponse)
    expect(result.current.estimate).toBeNull()
  })
})

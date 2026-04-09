import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIngredientNormalization } from '../useIngredientNormalization'
import type { Ingredient } from '../../../../types/nutrition'
import type { AxiosResponse } from 'axios'

vi.mock('../../../../utils/authApi', () => ({
  postWithAuth: vi.fn(),
}))
vi.mock('../../../../utils/apiUtils', () => ({
  buildApiUrl: (_base: string, endpoint: string) => endpoint,
}))

import { postWithAuth } from '../../../../utils/authApi'

const mockPostWithAuth = vi.mocked(postWithAuth)

const MOCK_INGREDIENT_AMBIGUOUS: Ingredient = { quantity: '', unit: '', item: 'some salt' }
const MOCK_INGREDIENT_CLEAR: Ingredient = { quantity: '2', unit: 'cups', item: 'flour' }

describe('useIngredientNormalization', () => {
  let mockUpdateIngredient: (index: number, field: keyof Ingredient, value: string) => void

  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateIngredient = vi.fn() as unknown as (index: number, field: keyof Ingredient, value: string) => void
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in idle state with no normalizations', () => {
    const { result } = renderHook(() =>
      useIngredientNormalization(mockUpdateIngredient)
    )
    expect(result.current.loadingState).toBe('idle')
    expect(result.current.normalizationStates.size).toBe(0)
    expect(result.current.hasPendingNormalizations).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('normalizeAll sets pending suggestions for ambiguous ingredients', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        normalizations: [
          {
            index: 0,
            original: 'some salt',
            normalized: '1/4 tsp fine sea salt',
            reason: 'Quantity unspecified',
            confidence: 0.9,
          },
        ],
      },
      status: 200, statusText: 'OK', headers: {}, config: { headers: {} as any },
    } as AxiosResponse)

    const { result } = renderHook(() =>
      useIngredientNormalization(mockUpdateIngredient)
    )

    await act(async () => {
      await result.current.normalizeAll(
        [MOCK_INGREDIENT_AMBIGUOUS, MOCK_INGREDIENT_CLEAR],
        'Bread'
      )
    })

    expect(result.current.loadingState).toBe('success')
    expect(result.current.normalizationStates.size).toBe(1)
    const state = result.current.normalizationStates.get(0)
    expect(state?.status).toBe('pending')
    expect(state?.normalized).toBe('1/4 tsp fine sea salt')
    expect(state?.confidence).toBeGreaterThanOrEqual(0.6)
    expect(result.current.hasPendingNormalizations).toBe(true)
  })

  it('applyNormalization updates ingredient and marks state applied', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        normalizations: [
          {
            index: 0,
            original: 'some salt',
            normalized: '1/4 tsp fine sea salt',
            reason: 'Quantity unspecified',
            confidence: 0.9,
          },
        ],
      },
      status: 200, statusText: 'OK', headers: {}, config: { headers: {} as any },
    } as AxiosResponse)

    const { result } = renderHook(() =>
      useIngredientNormalization(mockUpdateIngredient)
    )

    await act(async () => {
      await result.current.normalizeAll([MOCK_INGREDIENT_AMBIGUOUS], 'Bread')
    })

    act(() => {
      result.current.applyNormalization(0)
    })

    expect(mockUpdateIngredient).toHaveBeenCalledWith(0, 'item', '1/4 tsp fine sea salt')
    expect(mockUpdateIngredient).toHaveBeenCalledWith(0, 'quantity', '')
    expect(mockUpdateIngredient).toHaveBeenCalledWith(0, 'unit', '')
    expect(result.current.normalizationStates.get(0)?.status).toBe('applied')
    expect(result.current.hasPendingNormalizations).toBe(false)
  })

  it('dismissNormalization marks state dismissed without updating ingredient', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        normalizations: [
          {
            index: 0,
            original: 'some salt',
            normalized: '1/4 tsp fine sea salt',
            reason: 'Quantity unspecified',
            confidence: 0.9,
          },
        ],
      },
      status: 200, statusText: 'OK', headers: {}, config: { headers: {} as any },
    } as AxiosResponse)

    const { result } = renderHook(() =>
      useIngredientNormalization(mockUpdateIngredient)
    )

    await act(async () => {
      await result.current.normalizeAll([MOCK_INGREDIENT_AMBIGUOUS])
    })

    act(() => {
      result.current.dismissNormalization(0)
    })

    expect(mockUpdateIngredient).not.toHaveBeenCalled()
    expect(result.current.normalizationStates.get(0)?.status).toBe('dismissed')
    expect(result.current.hasPendingNormalizations).toBe(false)
  })

  it('normalizeAll sets error state on API failure', async () => {
    mockPostWithAuth.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useIngredientNormalization(mockUpdateIngredient)
    )

    await act(async () => {
      await result.current.normalizeAll([MOCK_INGREDIENT_AMBIGUOUS])
    })

    expect(result.current.loadingState).toBe('error')
    expect(result.current.error).toBe('Network error')
    expect(result.current.normalizationStates.size).toBe(0)
    expect(result.current.hasPendingNormalizations).toBe(false)
  })

  it('normalizeAll does nothing for empty ingredient list', async () => {
    const { result } = renderHook(() =>
      useIngredientNormalization(mockUpdateIngredient)
    )

    await act(async () => {
      await result.current.normalizeAll([])
    })

    expect(mockPostWithAuth).not.toHaveBeenCalled()
    expect(result.current.loadingState).toBe('idle')
  })

  it('clearNormalizations resets all state', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        normalizations: [
          {
            index: 0,
            original: 'some salt',
            normalized: '1/4 tsp fine sea salt',
            reason: 'Quantity unspecified',
            confidence: 0.9,
          },
        ],
      },
      status: 200, statusText: 'OK', headers: {}, config: { headers: {} as any },
    } as AxiosResponse)

    const { result } = renderHook(() =>
      useIngredientNormalization(mockUpdateIngredient)
    )

    await act(async () => {
      await result.current.normalizeAll([MOCK_INGREDIENT_AMBIGUOUS])
    })

    act(() => {
      result.current.clearNormalizations()
    })

    expect(result.current.normalizationStates.size).toBe(0)
    expect(result.current.loadingState).toBe('idle')
    expect(result.current.error).toBeNull()
  })
})

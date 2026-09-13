import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  queryClient,
  usePublicRecipes,
  useFeed,
  useToggleLikeMutation,
  useToggleSaveMutation,
} from './serverState'
import * as recipeStorageApi from './recipeStorageApi'
import type { Recipe } from '../types/nutrition'

vi.mock('./recipeStorageApi', () => ({
  getRecipes: vi.fn(),
  getPublicRecipes: vi.fn(),
  getFeed: vi.fn(),
  getRecipe: vi.fn(),
  getSavedRecipes: vi.fn(),
  likeRecipe: vi.fn(),
  unlikeRecipe: vi.fn(),
  bookmarkRecipe: vi.fn(),
  unbookmarkRecipe: vi.fn(),
}))

describe('Server-State Query Hooks & Cache', () => {
  const mockRecipe: Recipe = {
    id: 'r-1',
    userId: 'user-1',
    recipeName: 'Test Soup',
    ingredients: ['water', 'salt'],
    instructions: ['boil'],
    servings: 2,
    source: 'manual',
    isLikedByCurrentUser: false,
    likeCount: 5,
    isSavedByCurrentUser: false,
  } as Recipe

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('usePublicRecipes fetches data and caches it', async () => {
    vi.mocked(recipeStorageApi.getPublicRecipes).mockResolvedValue([mockRecipe])

    const { result } = renderHook(() => usePublicRecipes())

    expect(result.current.loading).toBe(true)

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.recipes).toEqual([mockRecipe])
    expect(recipeStorageApi.getPublicRecipes).toHaveBeenCalledTimes(1)
  })

  it('deduplicates simultaneous in-flight queries', async () => {
    let resolveFirst: (recipes: Recipe[]) => void
    const pendingPromise = new Promise<Recipe[]>((res) => {
      resolveFirst = res
    })

    vi.mocked(recipeStorageApi.getFeed).mockReturnValue(pendingPromise)

    const hook1 = renderHook(() => useFeed())
    const hook2 = renderHook(() => useFeed())

    expect(recipeStorageApi.getFeed).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveFirst!([mockRecipe])
      await pendingPromise
    })

    expect(hook1.result.current.recipes).toEqual([mockRecipe])
    expect(hook2.result.current.recipes).toEqual([mockRecipe])
  })

  it('useToggleLikeMutation optimistically updates public and feed queries', async () => {
    vi.mocked(recipeStorageApi.getPublicRecipes).mockResolvedValue([mockRecipe])
    vi.mocked(recipeStorageApi.likeRecipe).mockResolvedValue()

    const getSocial = (r: Recipe) => r as Recipe & { likeCount?: number; isLikedByCurrentUser?: boolean }

    // 1. Prime the cache
    const { result: publicHook } = renderHook(() => usePublicRecipes())
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })
    expect(getSocial(publicHook.current.recipes[0]).likeCount).toBe(5)
    expect(getSocial(publicHook.current.recipes[0]).isLikedByCurrentUser).toBe(false)

    // 2. Perform optimistic like
    const { result: mutationHook } = renderHook(() => useToggleLikeMutation())
    const [toggleLike] = mutationHook.current

    await act(async () => {
      await toggleLike('r-1', { isLiked: false, likeCount: 5 })
    })

    // Assert cache was updated immediately
    expect(getSocial(publicHook.current.recipes[0]).likeCount).toBe(6)
    expect(getSocial(publicHook.current.recipes[0]).isLikedByCurrentUser).toBe(true)
    expect(recipeStorageApi.likeRecipe).toHaveBeenCalledWith('r-1')
  })

  it('useToggleLikeMutation rolls back when API fails', async () => {
    const getSocial = (r: Recipe) => r as Recipe & { likeCount?: number; isLikedByCurrentUser?: boolean }
    vi.mocked(recipeStorageApi.getPublicRecipes).mockResolvedValue([mockRecipe])
    vi.mocked(recipeStorageApi.likeRecipe).mockRejectedValue(new Error('Network error'))

    const { result: publicHook } = renderHook(() => usePublicRecipes())
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    const { result: mutationHook } = renderHook(() => useToggleLikeMutation())
    const [toggleLike] = mutationHook.current

    await act(async () => {
      try {
        await toggleLike('r-1', { isLiked: false, likeCount: 5 })
      } catch (err) {
        expect(err).toBeDefined()
      }
    })

    // Assert rollback to original state
    expect(getSocial(publicHook.current.recipes[0]).likeCount).toBe(5)
    expect(getSocial(publicHook.current.recipes[0]).isLikedByCurrentUser).toBe(false)
  })

  it('useToggleSaveMutation optimistically updates savedRecipes and bookmark flags', async () => {
    vi.mocked(recipeStorageApi.bookmarkRecipe).mockResolvedValue()

    const { result: mutationHook } = renderHook(() => useToggleSaveMutation())
    const [toggleSave] = mutationHook.current

    await act(async () => {
      await toggleSave(mockRecipe, false)
    })

    const cachedSaved = queryClient.getSnapshot<Recipe[]>('savedRecipes').data
    expect(cachedSaved).toHaveLength(1)
    expect(cachedSaved![0].id).toBe('r-1')
    expect(recipeStorageApi.bookmarkRecipe).toHaveBeenCalledWith('r-1')
  })
})

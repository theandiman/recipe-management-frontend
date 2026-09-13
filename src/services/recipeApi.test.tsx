import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import React from 'react'
import { store } from '../store'
import {
  recipeApi,
  useRecipes,
  usePublicRecipes,
  useFeed,
  useRecipe,
  useSavedRecipes,
} from './recipeApi'
import * as storageApi from './recipeStorageApi'
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
  saveRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
)

type RecipeWithInteractions = Recipe & {
  isLikedByCurrentUser?: boolean
  likeCount?: number
  isSavedByCurrentUser?: boolean
}

describe('recipeApi RTK Query', () => {
  const sampleRecipe: RecipeWithInteractions = {
    id: 'rec-1',
    recipeName: 'Pancakes',
    ingredients: ['flour', 'milk', 'egg'],
    instructions: ['mix', 'cook'],
    servings: 2,
    source: 'user-created',
    isLikedByCurrentUser: false,
    likeCount: 5,
    isSavedByCurrentUser: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    store.dispatch(recipeApi.util.resetApiState())
  })

  describe('Queries and ergonomic hooks', () => {
    it('useRecipes fetches and provides recipes data', async () => {
      vi.mocked(storageApi.getRecipes).mockResolvedValueOnce([sampleRecipe])

      const { result } = renderHook(() => useRecipes(), { wrapper })

      await waitFor(() => {
        expect(result.current.recipes).toEqual([sampleRecipe])
      })
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('useRecipes handles errors correctly', async () => {
      vi.mocked(storageApi.getRecipes).mockRejectedValueOnce(new Error('Fetch failed'))

      const { result } = renderHook(() => useRecipes(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).toBe('Fetch failed')
      })
      expect(result.current.recipes).toEqual([])
    })

    it('usePublicRecipes respects boolean enabled / skip option', async () => {
      vi.mocked(storageApi.getPublicRecipes).mockResolvedValueOnce([sampleRecipe])

      const { result: skippedResult } = renderHook(() => usePublicRecipes(false), { wrapper })
      expect(skippedResult.current.recipes).toEqual([])
      expect(storageApi.getPublicRecipes).not.toHaveBeenCalled()

      const { result: activeResult } = renderHook(() => usePublicRecipes(true), { wrapper })
      await waitFor(() => {
        expect(activeResult.current.recipes).toEqual([sampleRecipe])
      })
      expect(storageApi.getPublicRecipes).toHaveBeenCalledTimes(1)
    })

    it('useFeed fetches feed recipes', async () => {
      vi.mocked(storageApi.getFeed).mockResolvedValueOnce([sampleRecipe])

      const { result } = renderHook(() => useFeed(), { wrapper })

      await waitFor(() => {
        expect(result.current.recipes).toEqual([sampleRecipe])
      })
    })

    it('useRecipe fetches a single recipe by id', async () => {
      vi.mocked(storageApi.getRecipe).mockResolvedValueOnce(sampleRecipe)

      const { result } = renderHook(() => useRecipe('rec-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.recipe).toEqual(sampleRecipe)
      })
    })

    it('useSavedRecipes fetches saved recipes', async () => {
      vi.mocked(storageApi.getSavedRecipes).mockResolvedValueOnce([sampleRecipe])

      const { result } = renderHook(() => useSavedRecipes(), { wrapper })

      await waitFor(() => {
        expect(result.current.savedRecipes).toEqual([sampleRecipe])
      })
    })
  })

  describe('Optimistic Updates & Rollbacks', () => {
    it('toggleLike optimistically updates likeCount and isLikedByCurrentUser, then commits', async () => {
      vi.mocked(storageApi.getPublicRecipes).mockResolvedValueOnce([sampleRecipe])
      vi.mocked(storageApi.likeRecipe).mockResolvedValueOnce(undefined)

      // Prime the cache
      const { result: queryResult } = renderHook(() => usePublicRecipes(), { wrapper })
      await waitFor(() => {
        expect(queryResult.current.recipes.length).toBe(1)
      })

      // Dispatch toggleLike mutation
      const [toggleLike] = renderHook(() => recipeApi.useToggleLikeMutation(), { wrapper }).result.current

      await act(async () => {
        await toggleLike({
          id: 'rec-1',
          currentlyLiked: false,
          currentLikeCount: 5,
        }).unwrap()
      })

      expect(storageApi.likeRecipe).toHaveBeenCalledWith('rec-1')
      const cached = recipeApi.endpoints.getPublicRecipes.select()(store.getState()).data as
        | RecipeWithInteractions[]
        | undefined
      expect(cached?.[0].isLikedByCurrentUser).toBe(true)
      expect(cached?.[0].likeCount).toBe(6)
    })

    it('toggleLike rolls back optimistic update when server request fails', async () => {
      vi.mocked(storageApi.getPublicRecipes).mockResolvedValueOnce([sampleRecipe])
      vi.mocked(storageApi.likeRecipe).mockRejectedValueOnce(new Error('Server error'))

      const { result: queryResult } = renderHook(() => usePublicRecipes(), { wrapper })
      await waitFor(() => {
        expect(queryResult.current.recipes.length).toBe(1)
      })

      const [toggleLike] = renderHook(() => recipeApi.useToggleLikeMutation(), { wrapper }).result.current

      await act(async () => {
        await expect(
          toggleLike({
            id: 'rec-1',
            currentlyLiked: false,
            currentLikeCount: 5,
          }).unwrap()
        ).rejects.toThrow()
      })

      const cached = recipeApi.endpoints.getPublicRecipes.select()(store.getState()).data as
        | RecipeWithInteractions[]
        | undefined
      expect(cached?.[0].isLikedByCurrentUser).toBe(false)
      expect(cached?.[0].likeCount).toBe(5)
    })

    it('toggleSave optimistically updates saved state and rolls back on failure', async () => {
      vi.mocked(storageApi.getSavedRecipes).mockResolvedValueOnce([])
      vi.mocked(storageApi.bookmarkRecipe).mockRejectedValueOnce(new Error('Save error'))

      const { result: savedResult } = renderHook(() => useSavedRecipes(), { wrapper })
      await waitFor(() => {
        expect(savedResult.current.savedRecipes).toEqual([])
      })

      const [toggleSave] = renderHook(() => recipeApi.useToggleSaveMutation(), { wrapper }).result.current

      await act(async () => {
        await expect(
          toggleSave({
            recipe: sampleRecipe,
            currentlySaved: false,
          }).unwrap()
        ).rejects.toThrow()
      })

      const cached = recipeApi.endpoints.getSavedRecipes.select()(store.getState()).data
      expect(cached).toEqual([])
    })
  })

  describe('Mutations: create, update, delete', () => {
    it('createRecipe calls saveRecipe and returns new recipe', async () => {
      vi.mocked(storageApi.saveRecipe).mockResolvedValueOnce(sampleRecipe)

      const [createRecipe] = renderHook(() => recipeApi.useCreateRecipeMutation(), { wrapper }).result.current
      let created: Recipe | undefined
      await act(async () => {
        created = await createRecipe(sampleRecipe).unwrap()
      })

      expect(storageApi.saveRecipe).toHaveBeenCalledWith(sampleRecipe)
      expect(created).toEqual(sampleRecipe)
    })

    it('updateRecipe calls updateRecipe and returns updated recipe', async () => {
      const updated = { ...sampleRecipe, recipeName: 'Updated Pancakes' }
      vi.mocked(storageApi.updateRecipe).mockResolvedValueOnce(updated)

      const [updateRecipe] = renderHook(() => recipeApi.useUpdateRecipeMutation(), { wrapper }).result.current
      let result: Recipe | undefined
      await act(async () => {
        result = await updateRecipe({ id: 'rec-1', recipe: updated }).unwrap()
      })

      expect(storageApi.updateRecipe).toHaveBeenCalledWith('rec-1', updated)
      expect(result).toEqual(updated)
    })

    it('deleteRecipe calls deleteRecipe on storageApi', async () => {
      vi.mocked(storageApi.deleteRecipe).mockResolvedValueOnce(undefined)

      const [deleteRecipe] = renderHook(() => recipeApi.useDeleteRecipeMutation(), { wrapper }).result.current
      await act(async () => {
        await deleteRecipe('rec-1').unwrap()
      })

      expect(storageApi.deleteRecipe).toHaveBeenCalledWith('rec-1')
    })
  })
})


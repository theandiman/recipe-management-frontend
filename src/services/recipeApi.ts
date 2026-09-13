import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Recipe } from '../types/nutrition'
import * as storageApi from './recipeStorageApi'

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const apiError = err as { response?: { data?: { message?: string } }; message?: string }
    if (apiError.response?.data?.message) return apiError.response.data.message
    if (apiError.message) return apiError.message
  }
  return fallback
}

export const recipeApi = createApi({
  reducerPath: 'recipeApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Recipe', 'PublicRecipes', 'Feed', 'SavedRecipes'],
  keepUnusedDataFor: 300, // 5 minutes cache default for server-state deduplication
  endpoints: (builder) => ({
    getRecipes: builder.query<Recipe[], void>({
      queryFn: async () => {
        try {
          const data = await storageApi.getRecipes()
          return { data: Array.isArray(data) ? data : [] }
        } catch (err: unknown) {
          return { error: { message: extractErrorMessage(err, 'Failed to fetch recipes') } }
        }
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Recipe' as const, id })), { type: 'Recipe', id: 'LIST' }]
          : [{ type: 'Recipe', id: 'LIST' }],
    }),

    getPublicRecipes: builder.query<Recipe[], void>({
      queryFn: async () => {
        try {
          const data = await storageApi.getPublicRecipes()
          return { data: Array.isArray(data) ? data : [] }
        } catch (err: unknown) {
          return { error: { message: extractErrorMessage(err, 'Failed to fetch public recipes') } }
        }
      },
      providesTags: [{ type: 'PublicRecipes', id: 'LIST' }],
    }),

    getFeed: builder.query<Recipe[], void>({
      queryFn: async () => {
        try {
          const data = await storageApi.getFeed()
          return { data: Array.isArray(data) ? data : [] }
        } catch (err: unknown) {
          return { error: { message: extractErrorMessage(err, 'Failed to fetch feed') } }
        }
      },
      providesTags: [{ type: 'Feed', id: 'LIST' }],
    }),

    getRecipe: builder.query<Recipe, string>({
      queryFn: async (id) => {
        try {
          const data = await storageApi.getRecipe(id)
          return { data }
        } catch (err: unknown) {
          return { error: { message: extractErrorMessage(err, 'Failed to fetch recipe') } }
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Recipe', id }],
    }),

    getSavedRecipes: builder.query<Recipe[], void>({
      queryFn: async () => {
        try {
          const data = await storageApi.getSavedRecipes()
          return { data: Array.isArray(data) ? data : [] }
        } catch (err: unknown) {
          return { error: { message: extractErrorMessage(err, 'Failed to fetch saved recipes') } }
        }
      },
      providesTags: [{ type: 'SavedRecipes', id: 'LIST' }],
    }),

    toggleLike: builder.mutation<void, { id: string; currentlyLiked: boolean; currentLikeCount: number }>({
      queryFn: async ({ id, currentlyLiked }) => {
        try {
          if (currentlyLiked) {
            await storageApi.unlikeRecipe(id)
          } else {
            await storageApi.likeRecipe(id)
          }
          return { data: undefined }
        } catch (err: unknown) {
          return { error: { message: extractErrorMessage(err, 'Failed to toggle like') } }
        }
      },
      async onQueryStarted({ id, currentlyLiked, currentLikeCount }, { dispatch, queryFulfilled }) {
        const nextLiked = !currentlyLiked
        const nextLikeCount = Math.max(0, currentLikeCount + (nextLiked ? 1 : -1))

        // Optimistically update getPublicRecipes
        const patchPublic = dispatch(
          recipeApi.util.updateQueryData('getPublicRecipes', undefined, (draft) => {
            const recipe = draft.find((r) => r.id === id) as
              | (Recipe & { isLikedByCurrentUser?: boolean; likeCount?: number })
              | undefined
            if (recipe) {
              recipe.isLikedByCurrentUser = nextLiked
              recipe.likeCount = nextLikeCount
            }
          })
        )

        // Optimistically update getFeed
        const patchFeed = dispatch(
          recipeApi.util.updateQueryData('getFeed', undefined, (draft) => {
            const recipe = draft.find((r) => r.id === id) as
              | (Recipe & { isLikedByCurrentUser?: boolean; likeCount?: number })
              | undefined
            if (recipe) {
              recipe.isLikedByCurrentUser = nextLiked
              recipe.likeCount = nextLikeCount
            }
          })
        )

        // Optimistically update getSavedRecipes
        const patchSaved = dispatch(
          recipeApi.util.updateQueryData('getSavedRecipes', undefined, (draft) => {
            const recipe = draft.find((r) => r.id === id) as
              | (Recipe & { isLikedByCurrentUser?: boolean; likeCount?: number })
              | undefined
            if (recipe) {
              recipe.isLikedByCurrentUser = nextLiked
              recipe.likeCount = nextLikeCount
            }
          })
        )

        // Optimistically update getRecipe
        const patchDetail = dispatch(
          recipeApi.util.updateQueryData('getRecipe', id, (draft) => {
            const recipe = draft as Recipe & { isLikedByCurrentUser?: boolean; likeCount?: number }
            recipe.isLikedByCurrentUser = nextLiked
            recipe.likeCount = nextLikeCount
          })
        )

        try {
          await queryFulfilled
        } catch {
          patchPublic.undo()
          patchFeed.undo()
          patchSaved.undo()
          patchDetail.undo()
        }
      },
    }),

    toggleSave: builder.mutation<void, { recipe: Recipe; currentlySaved: boolean }>({
      queryFn: async ({ recipe, currentlySaved }) => {
        if (!recipe.id) return { data: undefined }
        try {
          if (currentlySaved) {
            await storageApi.unbookmarkRecipe(recipe.id)
          } else {
            await storageApi.bookmarkRecipe(recipe.id)
          }
          return { data: undefined }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to toggle save'
          return { error: { message } }
        }
      },
      async onQueryStarted({ recipe, currentlySaved }, { dispatch, queryFulfilled }) {
        const id = recipe.id
        if (!id) return

        const nextSaved = !currentlySaved

        // Optimistically update getSavedRecipes
        const patchSaved = dispatch(
          recipeApi.util.updateQueryData('getSavedRecipes', undefined, (draft) => {
            if (currentlySaved) {
              return draft.filter((r) => r.id !== id)
            } else {
              draft.push({ ...recipe, isSavedByCurrentUser: true } as Recipe)
            }
          })
        )

        // Optimistically update getPublicRecipes
        const patchPublic = dispatch(
          recipeApi.util.updateQueryData('getPublicRecipes', undefined, (draft) => {
            const r = draft.find((item) => item.id === id) as
              | (Recipe & { isSavedByCurrentUser?: boolean })
              | undefined
            if (r) {
              r.isSavedByCurrentUser = nextSaved
            }
          })
        )

        // Optimistically update getFeed
        const patchFeed = dispatch(
          recipeApi.util.updateQueryData('getFeed', undefined, (draft) => {
            const r = draft.find((item) => item.id === id) as
              | (Recipe & { isSavedByCurrentUser?: boolean })
              | undefined
            if (r) {
              r.isSavedByCurrentUser = nextSaved
            }
          })
        )

        // Optimistically update getRecipe
        const patchDetail = dispatch(
          recipeApi.util.updateQueryData('getRecipe', id, (draft) => {
            const r = draft as (Recipe & { isSavedByCurrentUser?: boolean }) | undefined
            if (r) {
              r.isSavedByCurrentUser = nextSaved
            }
          })
        )

        try {
          await queryFulfilled
        } catch {
          patchSaved.undo()
          patchPublic.undo()
          patchFeed.undo()
          patchDetail.undo()
        }
      },
      invalidatesTags: [{ type: 'SavedRecipes', id: 'LIST' }],
    }),

    createRecipe: builder.mutation<Recipe, Recipe>({
      queryFn: async (recipe) => {
        try {
          const data = await storageApi.saveRecipe(recipe)
          return { data }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to create recipe'
          return { error: { message } }
        }
      },
      invalidatesTags: [
        { type: 'Recipe', id: 'LIST' },
        { type: 'PublicRecipes', id: 'LIST' },
        { type: 'Feed', id: 'LIST' },
      ],
    }),

    updateRecipe: builder.mutation<Recipe, { id: string; recipe: Recipe }>({
      queryFn: async ({ id, recipe }) => {
        try {
          const data = await storageApi.updateRecipe(id, recipe)
          return { data }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to update recipe'
          return { error: { message } }
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Recipe', id },
        { type: 'Recipe', id: 'LIST' },
        { type: 'PublicRecipes', id: 'LIST' },
        { type: 'Feed', id: 'LIST' },
      ],
    }),

    deleteRecipe: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await storageApi.deleteRecipe(id)
          return { data: undefined }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to delete recipe'
          return { error: { message } }
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Recipe', id },
        { type: 'Recipe', id: 'LIST' },
        { type: 'PublicRecipes', id: 'LIST' },
        { type: 'Feed', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetRecipesQuery,
  useGetPublicRecipesQuery,
  useGetFeedQuery,
  useGetRecipeQuery,
  useGetSavedRecipesQuery,
  useToggleLikeMutation,
  useToggleSaveMutation,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} = recipeApi

// Ergonomic alias hooks per Issue #640
export const useRecipes = (options?: { skip?: boolean }) => {
  const query = useGetRecipesQuery(undefined, options)
  return {
    ...query,
    recipes: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? ((query.error as { message?: string }).message ?? 'Error fetching recipes') : null,
    refetch: query.refetch,
  }
}

export const usePublicRecipes = (options?: { skip?: boolean } | boolean) => {
  const skip = typeof options === 'boolean' ? !options : (options?.skip ?? false)
  const query = useGetPublicRecipesQuery(undefined, { skip })
  return {
    ...query,
    recipes: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? ((query.error as { message?: string }).message ?? 'Error fetching public recipes') : null,
    refetch: query.refetch,
  }
}

export const useFeed = (options?: { skip?: boolean } | boolean) => {
  const skip = typeof options === 'boolean' ? !options : (options?.skip ?? false)
  const query = useGetFeedQuery(undefined, { skip })
  return {
    ...query,
    recipes: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? ((query.error as { message?: string }).message ?? 'Error fetching feed') : null,
    refetch: query.refetch,
  }
}

export const useRecipe = (id?: string, options?: { skip?: boolean }) => {
  const query = useGetRecipeQuery(id ?? '', { skip: !id || options?.skip })
  return {
    ...query,
    recipe: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? ((query.error as { message?: string }).message ?? 'Error fetching recipe') : null,
    refetch: query.refetch,
  }
}

export const useSavedRecipes = (options?: { skip?: boolean } | boolean) => {
  const skip = typeof options === 'boolean' ? !options : (options?.skip ?? false)
  const query = useGetSavedRecipesQuery(undefined, { skip })
  return {
    ...query,
    savedRecipes: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? ((query.error as { message?: string }).message ?? 'Error fetching saved recipes') : null,
    refetch: query.refetch,
  }
}

export const useSavedRecipesQuery = useSavedRecipes


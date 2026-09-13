import { useState, useEffect, useCallback, useRef } from 'react'
import type { Recipe } from '../types/nutrition'
import * as storageApi from './recipeStorageApi'

// ── Server State Cache Store ──────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T | null
  loading: boolean
  error: string | null
  timestamp: number
  promise: Promise<T> | null
  subscribers: Set<() => void>
}

class QueryClientStore {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultStaleTime = 3 * 60 * 1000 // 3 minutes

  private getOrCreateEntry<T>(key: string): CacheEntry<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, {
        data: null,
        loading: false,
        error: null,
        timestamp: 0,
        promise: null,
        subscribers: new Set(),
      })
    }
    return this.cache.get(key) as CacheEntry<T>
  }

  getSnapshot<T>(key: string): { data: T | null; loading: boolean; error: string | null; fetched: boolean } {
    const entry = this.getOrCreateEntry<T>(key)
    return {
      data: entry.data,
      loading: entry.loading,
      error: entry.error,
      fetched: entry.timestamp > 0,
    }
  }

  subscribe(key: string, callback: () => void): () => void {
    const entry = this.getOrCreateEntry(key)
    entry.subscribers.add(callback)
    return () => {
      entry.subscribers.delete(callback)
    }
  }

  notify(key: string) {
    const entry = this.cache.get(key)
    if (entry) {
      entry.subscribers.forEach((cb) => {
        try {
          cb()
        } catch (e) {
          console.error(`Error notifying subscriber for key ${key}:`, e)
        }
      })
    }
  }

  async fetchQuery<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { staleTime?: number; force?: boolean } = {}
  ): Promise<T> {
    const entry = this.getOrCreateEntry<T>(key)
    const staleTime = options.staleTime ?? this.defaultStaleTime
    const isStale = Date.now() - entry.timestamp > staleTime

    // Return cached data if fresh and not forcing refetch
    if (!options.force && entry.data !== null && !isStale) {
      return entry.data
    }

    // Deduplicate in-flight requests
    if (entry.promise) {
      return entry.promise
    }

    entry.loading = true
    entry.error = null
    this.notify(key)

    entry.promise = (async () => {
      try {
        const result = await fetcher()
        entry.data = result
        entry.error = null
        entry.timestamp = Date.now()
        return result
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred'
        const apiError = err as { response?: { data?: { message?: string } } }
        entry.error = apiError?.response?.data?.message || message
        throw err
      } finally {
        entry.loading = false
        entry.promise = null
        this.notify(key)
      }
    })()

    return entry.promise
  }

  setQueryData<T>(key: string, updater: (prev: T | null) => T | null) {
    const entry = this.getOrCreateEntry<T>(key)
    entry.data = updater(entry.data)
    entry.timestamp = Date.now()
    this.notify(key)
  }

  invalidateQueries(keyPrefix: string) {
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(keyPrefix)) {
        entry.timestamp = 0
      }
    }
  }

  clear() {
    this.cache.clear()
  }
}

export const queryClient = new QueryClientStore()

export const clearServerStateCache = () => {
  queryClient.clear()
}

// Automatically reset cache after each test in test runners with globals
if (
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as Record<string, unknown>).afterEach === 'function'
) {
  ((globalThis as unknown) as { afterEach: (fn: () => void) => void }).afterEach(() => {
    queryClient.clear()
  })
}

// ── Generic Query Hook ────────────────────────────────────────────────────────

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { enabled?: boolean; staleTime?: number } = {}
) {
  const enabled = options.enabled ?? true
  const [, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    return queryClient.subscribe(key, () => {
      setTick((t) => t + 1)
    })
  }, [key])

  const refetch = useCallback(
    async (force = true) => {
      if (!enabled) return
      try {
        return await queryClient.fetchQuery(key, fetcherRef.current, {
          staleTime: options.staleTime,
          force,
        })
      } catch {
        // Error is set in cache snapshot
      }
    },
    [key, enabled, options.staleTime]
  )

  useEffect(() => {
    if (enabled) {
      refetch(false)
    }
  }, [key, enabled, refetch])

  const snapshot = queryClient.getSnapshot<T>(key)
  const isInitialLoading = enabled && !snapshot.fetched && snapshot.error === null
  const loading = snapshot.loading || isInitialLoading

  return {
    data: snapshot.data,
    loading,
    isFetching: snapshot.loading,
    error: snapshot.error,
    refetch: () => refetch(true),
  }
}

// ── Domain Query Hooks ────────────────────────────────────────────────────────

/**
 * Hook to retrieve personal user recipes with caching.
 */
export const useRecipes = () => {
  const query = useQuery<Recipe[]>('recipes', () => storageApi.getRecipes())
  return {
    recipes: query.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

/**
 * Hook to retrieve public community recipes with deduplication and caching.
 */
export const usePublicRecipes = (enabled = true) => {
  const query = useQuery<Recipe[]>('publicRecipes', () => storageApi.getPublicRecipes(), { enabled })
  return {
    recipes: query.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

/**
 * Hook to retrieve follower feed recipes with deduplication and caching.
 */
export const useFeed = (enabled = true) => {
  const query = useQuery<Recipe[]>('feed', () => storageApi.getFeed(), { enabled })
  return {
    recipes: query.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

/**
 * Hook to retrieve a specific recipe by ID.
 */
export const useRecipe = (id?: string) => {
  const query = useQuery<Recipe>(`recipe:${id}`, () => storageApi.getRecipe(id!), {
    enabled: !!id,
  })
  return {
    recipe: query.data,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

/**
 * Hook to retrieve saved/bookmarked recipes.
 */
export const useSavedRecipesQuery = (enabled = true) => {
  const query = useQuery<Recipe[]>('savedRecipes', () => storageApi.getSavedRecipes(), { enabled })
  return {
    savedRecipes: query.data ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

// ── Optimistic Mutation Hooks ─────────────────────────────────────────────────

/**
 * Optimistic like toggle mutation. Updates the like count and state across
 * all cached recipe lists and single recipe views immediately.
 */
export const useToggleLikeMutation = () => {
  const [isLoading, setIsLoading] = useState(false)

  const toggleLike = useCallback(
    async (recipeId: string, currentState: { isLiked: boolean; likeCount: number }) => {
      const nextLiked = !currentState.isLiked
      const nextLikeCount = Math.max(0, currentState.likeCount + (nextLiked ? 1 : -1))

      const updateRecipeInList = (list: Recipe[] | null): Recipe[] | null => {
        if (!list) return null
        return list.map((r) => {
          if (r.id === recipeId) {
            return {
              ...r,
              isLikedByCurrentUser: nextLiked,
              likeCount: nextLikeCount,
            } as Recipe
          }
          return r
        })
      }

      // 1. Optimistic updates across all query caches
      queryClient.setQueryData<Recipe[]>('publicRecipes', updateRecipeInList)
      queryClient.setQueryData<Recipe[]>('feed', updateRecipeInList)
      queryClient.setQueryData<Recipe[]>('savedRecipes', updateRecipeInList)
      queryClient.setQueryData<Recipe>(`recipe:${recipeId}`, (current) => {
        if (!current) return null
        return {
          ...current,
          isLikedByCurrentUser: nextLiked,
          likeCount: nextLikeCount,
        } as Recipe
      })

      setIsLoading(true)
      try {
        if (currentState.isLiked) {
          await storageApi.unlikeRecipe(recipeId)
        } else {
          await storageApi.likeRecipe(recipeId)
        }
      } catch (err) {
        console.error('Failed to toggle like on server, reverting:', err)
        // Rollback
        const rollbackRecipeInList = (list: Recipe[] | null): Recipe[] | null => {
          if (!list) return null
          return list.map((r) => {
            if (r.id === recipeId) {
              return {
                ...r,
                isLikedByCurrentUser: currentState.isLiked,
                likeCount: currentState.likeCount,
              } as Recipe
            }
            return r
          })
        }
        queryClient.setQueryData<Recipe[]>('publicRecipes', rollbackRecipeInList)
        queryClient.setQueryData<Recipe[]>('feed', rollbackRecipeInList)
        queryClient.setQueryData<Recipe[]>('savedRecipes', rollbackRecipeInList)
        queryClient.setQueryData<Recipe>(`recipe:${recipeId}`, (current) => {
          if (!current) return null
          return {
            ...current,
            isLikedByCurrentUser: currentState.isLiked,
            likeCount: currentState.likeCount,
          } as Recipe
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return [toggleLike, { isLoading }] as const
}

/**
 * Optimistic bookmark/save toggle mutation. Updates saved recipes list
 * and bookmark flags across all cached recipe queries immediately.
 */
export const useToggleSaveMutation = () => {
  const [isLoading, setIsLoading] = useState(false)

  const toggleSave = useCallback(async (recipe: Recipe, wasSaved: boolean) => {
    if (!recipe.id) return
    const recipeId = recipe.id
    const nextSaved = !wasSaved

    // 1. Optimistic updates
    queryClient.setQueryData<Recipe[]>('savedRecipes', (current) => {
      const list = current ?? []
      if (wasSaved) {
        return list.filter((r) => r.id !== recipeId)
      } else {
        return [...list, { ...recipe, isSavedByCurrentUser: true }]
      }
    })

    const updateSavedFlag = (list: Recipe[] | null): Recipe[] | null => {
      if (!list) return null
      return list.map((r) => {
        if (r.id === recipeId) {
          return { ...r, isSavedByCurrentUser: nextSaved } as Recipe
        }
        return r
      })
    }

    queryClient.setQueryData<Recipe[]>('publicRecipes', updateSavedFlag)
    queryClient.setQueryData<Recipe[]>('feed', updateSavedFlag)
    queryClient.setQueryData<Recipe>(`recipe:${recipeId}`, (current) => {
      if (!current) return null
      return { ...current, isSavedByCurrentUser: nextSaved } as Recipe
    })

    setIsLoading(true)
    try {
      if (wasSaved) {
        await storageApi.unbookmarkRecipe(recipeId)
      } else {
        await storageApi.bookmarkRecipe(recipeId)
      }
    } catch (err) {
      console.error('Failed to toggle bookmark on server, reverting:', err)
      // Rollback
      queryClient.setQueryData<Recipe[]>('savedRecipes', (current) => {
        const list = current ?? []
        if (wasSaved) {
          return [...list, recipe]
        } else {
          return list.filter((r) => r.id !== recipeId)
        }
      })
      const rollbackFlag = (list: Recipe[] | null): Recipe[] | null => {
        if (!list) return null
        return list.map((r) => {
          if (r.id === recipeId) {
            return { ...r, isSavedByCurrentUser: wasSaved } as Recipe
          }
          return r
        })
      }
      queryClient.setQueryData<Recipe[]>('publicRecipes', rollbackFlag)
      queryClient.setQueryData<Recipe[]>('feed', rollbackFlag)
      queryClient.setQueryData<Recipe>(`recipe:${recipeId}`, (current) => {
        if (!current) return null
        return { ...current, isSavedByCurrentUser: wasSaved } as Recipe
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return [toggleSave, { isLoading }] as const
}

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { bookmarkRecipe, getSavedRecipes, unbookmarkRecipe } from '../../services/recipeStorageApi'
import type { Recipe } from '../../types/nutrition'

interface SavedRecipesContextType {
  savedIds: Set<string>
  savedRecipes: Recipe[]
  isSaved: (id: string) => boolean
  toggleSave: (recipe: Recipe) => Promise<void>
  isLoading: boolean
  reload: () => Promise<void>
}

const SavedRecipesContext = createContext<SavedRecipesContextType | undefined>(undefined)

export const useSavedRecipes = (): SavedRecipesContextType => {
  const ctx = useContext(SavedRecipesContext)
  if (!ctx) {
    throw new Error('useSavedRecipes must be used within a SavedRecipesProvider')
  }
  return ctx
}

export const SavedRecipesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // Track in-flight toggle requests to prevent duplicate calls
  const pendingRef = useRef<Set<string>>(new Set())

  const savedIds = React.useMemo(
    () => new Set((Array.isArray(savedRecipes) ? savedRecipes : []).map((r) => r.id).filter(Boolean) as string[]),
    [savedRecipes]
  )

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setIsLoading(true)
      const data = await getSavedRecipes()
      setSavedRecipes(Array.isArray(data) ? data : [])
    } catch (err) {
      if (import.meta.env.VITE_TEST_MODE !== 'true') {
        console.error('Failed to load saved recipes:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      load()
    } else {
      setSavedRecipes([])
    }
  }, [isAuthenticated, load])

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds])

  const toggleSave = useCallback(
    async (recipe: Recipe) => {
      if (!recipe.id) return
      const id = recipe.id
      if (pendingRef.current.has(id)) return
      pendingRef.current.add(id)

      const wasSaved = savedIds.has(id)

      // Optimistic update
      if (wasSaved) {
        setSavedRecipes((prev) => prev.filter((r) => r.id !== id))
      } else {
        setSavedRecipes((prev) => [...prev, recipe])
      }

      try {
        if (wasSaved) {
          await unbookmarkRecipe(id)
        } else {
          await bookmarkRecipe(id)
        }
      } catch (err) {
        console.error('Failed to toggle bookmark:', err)
        // Rollback optimistic update
        if (wasSaved) {
          setSavedRecipes((prev) => [...prev, recipe])
        } else {
          setSavedRecipes((prev) => prev.filter((r) => r.id !== id))
        }
      } finally {
        pendingRef.current.delete(id)
      }
    },
    [savedIds]
  )

  return (
    <SavedRecipesContext.Provider value={{ savedIds, savedRecipes, isSaved, toggleSave, isLoading, reload: load }}>
      {children}
    </SavedRecipesContext.Provider>
  )
}

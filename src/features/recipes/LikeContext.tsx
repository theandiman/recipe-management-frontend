import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { likeRecipe, unlikeRecipe } from '../../services/recipeStorageApi'
import { useAuth } from '../auth/AuthContext'

interface LikeState {
  isLiked: boolean
  likeCount: number
}

interface LikeContextType {
  getLikeState: (id: string) => LikeState | undefined
  initRecipe: (id: string, isLiked: boolean, likeCount: number) => void
  toggleLike: (id: string, initialState?: LikeState) => Promise<void>
}

const LikeContext = createContext<LikeContextType | undefined>(undefined)

export const useLikeContext = (): LikeContextType => {
  const ctx = useContext(LikeContext)
  if (!ctx) {
    throw new Error('useLikeContext must be used within a LikeProvider')
  }
  return ctx
}

export const LikeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [likeMap, setLikeMap] = useState<Record<string, LikeState>>({})
  const pendingRef = useRef<Set<string>>(new Set())

  const prevAuthRef = useRef(isAuthenticated)
  // Incremented on every logout; captured by toggleLike before each API call so
  // the catch block can detect whether a logout occurred mid-flight and skip rollback.
  const authGenRef = useRef(0)

  // Reset isLiked flags when user logs out; preserve counts as public data
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      authGenRef.current += 1
      setLikeMap((prev) => {
        const next: Record<string, LikeState> = {}
        for (const id in prev) {
          next[id] = { isLiked: false, likeCount: prev[id].likeCount }
        }
        return next
      })
      pendingRef.current.clear()
    }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated])

  const getLikeState = useCallback(
    (id: string): LikeState | undefined => likeMap[id],
    [likeMap],
  )

  const initRecipe = useCallback(
    (id: string, isLiked: boolean, likeCount: number) => {
      setLikeMap((prev) => {
        // Don't overwrite in-flight optimistic state
        if (pendingRef.current.has(id)) return prev

        const existing = prev[id]
        if (
          existing !== undefined &&
          existing.isLiked === isLiked &&
          existing.likeCount === likeCount
        ) {
          return prev
        }
        return { ...prev, [id]: { isLiked, likeCount } }
      })
    },
    [],
  )

  const toggleLike = useCallback(
    async (id: string, initialState?: LikeState) => {
      if (!isAuthenticated) return
      if (pendingRef.current.has(id)) return

      // Use context state if already initialized; fall back to the initial state
      // passed by the caller (e.g. a fast click before useEffect runs initRecipe).
      const prev = likeMap[id] ?? initialState
      if (!prev) return

      // Capture the current auth generation before the async call so the catch
      // block can tell whether the user logged out while the request was in-flight.
      const capturedGen = authGenRef.current

      pendingRef.current.add(id)

      const newLiked = !prev.isLiked
      const newCount = prev.likeCount + (newLiked ? 1 : -1)

      // Optimistic update
      setLikeMap((current) => ({
        ...current,
        [id]: { isLiked: newLiked, likeCount: newCount },
      }))

      try {
        if (newLiked) {
          await likeRecipe(id)
        } else {
          await unlikeRecipe(id)
        }
      } catch {
        // Skip rollback if the user logged out while the request was in-flight;
        // the logout handler has already reset isLiked to false.
        if (authGenRef.current === capturedGen) {
          setLikeMap((current) => ({
            ...current,
            [id]: prev,
          }))
          toast.error('Failed to update like status. Please try again.')
        }
      } finally {
        pendingRef.current.delete(id)
      }
    },
    [likeMap, isAuthenticated],
  )

  return (
    <LikeContext.Provider value={{ getLikeState, initRecipe, toggleLike }}>
      {children}
    </LikeContext.Provider>
  )
}

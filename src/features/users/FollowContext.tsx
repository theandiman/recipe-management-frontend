import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { followUser, unfollowUser } from '../../services/userApi'
import { useAuth } from '../auth/AuthContext'

interface FollowState {
  isFollowed: boolean
  followerCount: number | undefined
}

interface FollowContextType {
  getFollowState: (uid: string) => FollowState | undefined
  initUser: (uid: string, isFollowed: boolean, followerCount: number | undefined) => void
  toggleFollow: (uid: string) => Promise<void>
}

const FollowContext = createContext<FollowContextType | undefined>(undefined)

export const useFollowContext = (): FollowContextType => {
  const ctx = useContext(FollowContext)
  if (!ctx) {
    throw new Error('useFollowContext must be used within a FollowProvider')
  }
  return ctx
}

export const FollowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [followMap, setFollowMap] = useState<Record<string, FollowState>>({})
  const pendingRef = useRef<Set<string>>(new Set())

  const prevAuthRef = useRef(isAuthenticated)

  // Clear all state only when user actively logs out (auth transitions true→false)
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      setFollowMap({})
    }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated])

  const getFollowState = useCallback(
    (uid: string): FollowState | undefined => followMap[uid],
    [followMap],
  )

  const initUser = useCallback(
    (uid: string, isFollowed: boolean, followerCount: number | undefined) => {
      setFollowMap((prev) => {
        // Don't overwrite in-flight optimistic state
        if (pendingRef.current.has(uid)) return prev

        const existing = prev[uid]
        if (
          existing !== undefined &&
          existing.isFollowed === isFollowed &&
          existing.followerCount === followerCount
        ) {
          return prev
        }
        return { ...prev, [uid]: { isFollowed, followerCount } }
      })
    },
    [],
  )

  const toggleFollow = useCallback(
    async (uid: string) => {
      if (!isAuthenticated) return
      if (pendingRef.current.has(uid)) return

      const prev = followMap[uid]
      if (!prev) return

      pendingRef.current.add(uid)

      const newFollowed = !prev.isFollowed
      const newCount =
        prev.followerCount !== undefined ? prev.followerCount + (newFollowed ? 1 : -1) : undefined

      // Optimistic update
      setFollowMap((current) => ({
        ...current,
        [uid]: { isFollowed: newFollowed, followerCount: newCount },
      }))

      try {
        if (newFollowed) {
          await followUser(uid)
        } else {
          await unfollowUser(uid)
        }
      } catch {
        // Rollback optimistic update
        setFollowMap((current) => ({
          ...current,
          [uid]: prev,
        }))
        toast.error('Failed to update follow status. Please try again.')
      } finally {
        pendingRef.current.delete(uid)
      }
    },
    [followMap, isAuthenticated],
  )

  return <FollowContext.Provider value={{ getFollowState, initUser, toggleFollow }}>{children}</FollowContext.Provider>
}

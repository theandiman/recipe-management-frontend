import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getUserProfile } from '../../services/userApi'
import { useAuth } from '../../features/auth/AuthContext'
import RecipeCard from '../../components/RecipeCard'
import { RecipeCardSkeleton } from '../../components/skeletons/RecipeCardSkeleton'
import { FollowListModal } from './FollowListModal'
import { ProfileSettingsModal } from './ProfileSettingsModal'
import { FollowButton } from './FollowButton'
import { useFollowContext } from './FollowContext'
import type { UserProfile } from '../../services/userApi'

export const UserProfilePage: React.FC = () => {
  const { uid: paramUid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const targetUid = paramUid || currentUser?.uid
  const { initUser, getFollowState } = useFollowContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUid) return
      try {
        setLoading(true)
        setNotFound(false)
        setError(null)
        const data = await getUserProfile(targetUid)
        setProfile(data)
        initUser(targetUid, data.isFollowedByCurrentUser ?? false, data.followerCount)
      } catch (err: unknown) {
        const apiError = err as { response?: { status?: number; data?: { message?: string } } }
        if (apiError.response?.status === 404) {
          setNotFound(true)
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load profile'
          setError(apiError.response?.data?.message || errorMessage)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [targetUid, initUser])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div
            data-testid="loading-spinner"
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"
          />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
        <div className="text-center py-16">
          <div className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-100 mb-2">User not found</h2>
          <p className="text-gray-500 dark:text-gray-400">The profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading profile</p>
          <p className="text-sm mt-1">{error || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  const avatarLetter = (profile.displayName || profile.uid)?.[0]?.toUpperCase() || '?'

  const isPrivateAccount =
    profile.visibility === 'PRIVATE' &&
    targetUid !== currentUser?.uid &&
    !profile.isFollowedByCurrentUser

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Go Back
      </button>

      {/* Profile header */}
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 sm:p-8 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {avatarLetter}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {profile.displayName}
              </h1>
              {profile.visibility === 'PRIVATE' && (
                <span
                  title="Private Account"
                  className="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Private
                </span>
              )}
            </div>

            {/* Follower / Following counts – followerCount reads from context for optimistic updates */}
            {!isPrivateAccount && (() => {
              const contextState = targetUid ? getFollowState(targetUid) : undefined
              const displayFollowerCount =
                contextState !== undefined ? contextState.followerCount : profile.followerCount
              return (displayFollowerCount !== undefined || profile.followingCount !== undefined) ? (
                <div className="flex items-center justify-center sm:justify-start gap-4 mb-2">
                  {displayFollowerCount !== undefined && (
                    <button
                      type="button"
                      onClick={() => setFollowModal('followers')}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none"
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{displayFollowerCount}</span>
                      {' '}
                      {displayFollowerCount === 1 ? 'follower' : 'followers'}
                    </button>
                  )}
                  {profile.followingCount !== undefined && (
                    <button
                      type="button"
                      onClick={() => setFollowModal('following')}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none"
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{profile.followingCount}</span>
                      {' '}
                      following
                    </button>
                  )}
                </div>
              ) : null
            })()}

            {profile.bio && (
              <p className="text-gray-600 dark:text-gray-300 mb-3">{profile.bio}</p>
            )}
            {!isPrivateAccount && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {profile.publicRecipeCount}{' '}
                {profile.publicRecipeCount === 1 ? 'public recipe' : 'public recipes'}
              </p>
            )}

            {/* Follow / Unfollow button or Edit Profile button */}
            {targetUid === currentUser?.uid ? (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit profile
              </button>
            ) : (
              targetUid && <FollowButton uid={targetUid} />
            )}
          </div>
        </div>
      </motion.div>

      {/* Content area: Private banner or Public recipes grid */}
      {isPrivateAccount ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center my-8">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">This Account is Private</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Follow this user to see their public recipes and details.</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Public Recipes</h2>

          {profile.publicRecipes.length === 0 ? (
            <motion.div
              className="text-center py-12 text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              No public recipes yet.
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {profile.publicRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                >
                  <RecipeCard
                    recipe={recipe}
                    onView={(id) => navigate(`/dashboard/recipes/${id}`)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
      {/* Followers / Following modal */}
      {followModal && targetUid && (
        <FollowListModal
          uid={targetUid}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
      {/* Edit Profile Modal */}
      {isEditingProfile && profile && (
        <ProfileSettingsModal
          profile={profile}
          onClose={() => setIsEditingProfile(false)}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}
    </div>
  )
}

export const UserProfilePageSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 sm:p-8 mb-8 animate-pulse">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-48" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-64" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24" />
          <div className="h-9 bg-gray-200 dark:bg-slate-700 rounded w-24" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  </div>
)

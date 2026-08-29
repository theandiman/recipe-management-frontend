import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { followUser, unfollowUser, type UserProfile } from '../../../services/userApi'

interface CreatorCardProps {
  creator: UserProfile
  currentUserId?: string
}

const UserPlusIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
)

const UserCheckIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm11 1l-5 5-2.5-2.5" />
  </svg>
)

const UtensilsIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const UsersIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator, currentUserId }) => {
  const [isFollowing, setIsFollowing] = useState(creator.isFollowedByCurrentUser || false)
  const [followerCount, setFollowerCount] = useState(creator.followerCount || 0)
  const [loading, setLoading] = useState(false)

  const isSelf = currentUserId && currentUserId === creator.uid

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading || isSelf) return

    setLoading(true)
    const prev = isFollowing
    setIsFollowing(!prev)
    setFollowerCount((c) => (prev ? c - 1 : c + 1))

    try {
      if (prev) {
        await unfollowUser(creator.uid)
      } else {
        await followUser(creator.uid)
      }
    } catch (err) {
      console.error('Failed to toggle follow state:', err)
      setIsFollowing(prev)
      setFollowerCount((c) => (prev ? c + 1 : c - 1))
    } finally {
      setLoading(false)
    }
  }

  const initial = (creator.displayName || 'C')[0].toUpperCase()

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between mb-4">
          <Link to={`/user/${creator.uid}`} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                {creator.displayName || 'Anonymous Chef'}
              </h3>
              <p className="text-xs text-slate-400">Home Cook & Creator</p>
            </div>
          </Link>

          {!isSelf && currentUserId && (
            <button
              onClick={handleFollowToggle}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                isFollowing
                  ? 'bg-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400 border border-slate-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheckIcon className="w-3.5 h-3.5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-3.5 h-3.5" />
                  Follow
                </>
              )}
            </button>
          )}
        </div>

        {creator.bio && (
          <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
            {creator.bio}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs font-medium text-slate-400 pt-3 border-t border-slate-800/80">
        <span className="flex items-center gap-1">
          <UtensilsIcon className="w-3.5 h-3.5 text-amber-400" />
          {creator.publicRecipeCount || 0} Recipes
        </span>
        <span className="flex items-center gap-1">
          <UsersIcon className="w-3.5 h-3.5 text-amber-400" />
          {followerCount} Followers
        </span>
      </div>
    </div>
  )
}

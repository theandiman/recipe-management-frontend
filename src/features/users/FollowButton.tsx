import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useFollowContext } from './FollowContext'

interface FollowButtonProps {
  uid: string
}

export const FollowButton: React.FC<FollowButtonProps> = ({ uid }) => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { getFollowState, toggleFollow } = useFollowContext()

  const state = getFollowState(uid)

  // Don't render until the follow state has been initialized
  if (state === undefined) return null

  const { isFollowed } = state

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    await toggleFollow(uid)
  }

  return (
    <button
      type="button"
      aria-pressed={isFollowed}
      className={`px-5 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
        isFollowed
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-emerald-600 text-white hover:bg-emerald-700'
      }`}
      onClick={handleClick}
    >
      {isFollowed ? 'Following' : 'Follow'}
    </button>
  )
}

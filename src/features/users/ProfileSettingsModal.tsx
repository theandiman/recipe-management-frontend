import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { updateMyProfile } from '../../services/userApi'
import { uploadAvatarImage, deleteAvatarImage } from '../../utils/imageStorage'
import type { UserProfile, UpdateUserProfileRequest } from '../../services/userApi'

export interface ProfileSettingsModalProps {
  profile: UserProfile
  onClose: () => void
  onProfileUpdated: (updatedProfile: UserProfile) => void
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  profile,
  onClose,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl || null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image must be under 5 MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Avatar must be a JPEG, PNG, or WEBP image')
      return
    }

    try {
      setIsUploadingAvatar(true)
      setError(null)

      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string
          const uploadedUrl = await uploadAvatarImage(dataUrl, profile.uid)
          setAvatarUrl(uploadedUrl)
          toast.success('Avatar uploaded')
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to upload avatar'
          setError(msg)
          toast.error(msg)
        } finally {
          setIsUploadingAvatar(false)
        }
      }
      reader.onerror = () => {
        setError('Failed to read image file')
        setIsUploadingAvatar(false)
      }
      reader.readAsDataURL(file)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process avatar file'
      setError(msg)
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true)
      setError(null)
      await deleteAvatarImage(profile.uid)
      setAvatarUrl('')
      toast.success('Avatar removed')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove avatar'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const payload: UpdateUserProfileRequest = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        visibility,
        avatarUrl: avatarUrl === '' ? '' : avatarUrl || undefined,
      }

      const updated = await updateMyProfile(payload)
      toast.success('Profile updated successfully')
      onProfileUpdated(updated)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const avatarLetter = (displayName || profile.uid)?.[0]?.toUpperCase() || '?'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          role="dialog"
          aria-labelledby="modal-title"
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-slate-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Avatar section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                    {avatarLetter}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  data-testid="avatar-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || isSaving}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Upload photo
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar || isSaving}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="text-right text-xs text-gray-400 mt-1">{displayName.length}/50</div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="text-right text-xs text-gray-400 mt-1">{bio.length}/500</div>
            </div>

            {/* Visibility Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Privacy
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                    visibility === 'PUBLIC'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-medium'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                  <div>
                    <div className="text-sm font-semibold">Public</div>
                    <div className="text-xs opacity-75">Anyone can view recipes</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                    visibility === 'PRIVATE'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-medium'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <div className="text-sm font-semibold">Private</div>
                    <div className="text-xs opacity-75">Only followers can view</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingAvatar}
                className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isSaving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Save changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

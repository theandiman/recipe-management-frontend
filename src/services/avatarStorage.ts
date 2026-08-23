import { deleteObject, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../config/firebase'

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024
export const MAX_AVATAR_DIMENSION = 2048

const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export interface AvatarReference {
  storagePath: string
  contentType: string
}

export function avatarStoragePath(userId: string): string {
  if (
    !userId ||
    userId.includes('/') ||
    userId.includes('\\') ||
    [...userId].some((character) => character.charCodeAt(0) < 32)
  ) {
    throw new Error('Invalid user identifier')
  }

  return `avatars/${userId}/avatar`
}

export async function validateAvatarFile(file: File): Promise<void> {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.')
  }

  if (file.size >= MAX_AVATAR_FILE_SIZE) {
    throw new Error(`Choose an image smaller than ${MAX_AVATAR_FILE_SIZE / (1024 * 1024)} MB.`)
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => {
        if (
          image.width === 0 ||
          image.height === 0 ||
          image.width > MAX_AVATAR_DIMENSION ||
          image.height > MAX_AVATAR_DIMENSION
        ) {
          reject(
            new Error(
              `Choose an image no larger than ${MAX_AVATAR_DIMENSION} × ${MAX_AVATAR_DIMENSION} pixels.`,
            ),
          )
          return
        }

        resolve()
      }
      image.onerror = () => reject(new Error('The selected image could not be read.'))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<AvatarReference> {
  const storagePath = avatarStoragePath(userId)
  await validateAvatarFile(file)

  try {
    await uploadBytes(ref(storage, storagePath), file, {
      contentType: file.type,
      cacheControl: 'private, max-age=0, no-store',
    })
  } catch (error) {
    throw new Error('Unable to upload the avatar. Please try again.', { cause: error })
  }

  return { storagePath, contentType: file.type }
}

export async function removeAvatar(userId: string): Promise<void> {
  try {
    await deleteObject(ref(storage, avatarStoragePath(userId)))
  } catch (error) {
    if (isObjectNotFound(error)) {
      return
    }

    throw new Error('Unable to remove the avatar. Please try again.', { cause: error })
  }
}

function isObjectNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'storage/object-not-found'
  )
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_AVATAR_DIMENSION,
  MAX_AVATAR_FILE_SIZE,
  avatarStoragePath,
  removeAvatar,
  uploadAvatar,
  validateAvatarFile,
} from './avatarStorage'
import { deleteObject, ref, uploadBytes } from 'firebase/storage'

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  deleteObject: vi.fn(),
}))

vi.mock('../config/firebase', () => ({
  storage: {},
}))

const imageFile = (type = 'image/jpeg') =>
  new File(['avatar'], 'avatar.jpg', { type })

const mockDecodedImage = (width: number, height: number) => {
  vi.stubGlobal(
    'Image',
    class {
      width = width
      height = height
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    },
  )
}

describe('avatarStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:avatar'),
      revokeObjectURL: vi.fn(),
    })
    mockDecodedImage(512, 512)
  })

  it('uses one deterministic object per user so replacements do not leave older objects behind', () => {
    expect(avatarStoragePath('user-123')).toBe('avatars/user-123/avatar')
    expect(avatarStoragePath('user-123')).toBe(avatarStoragePath('user-123'))
    expect(() => avatarStoragePath('user/123')).toThrow('Invalid user identifier')
  })

  it('rejects unsupported image MIME types before attempting to decode the file', async () => {
    await expect(validateAvatarFile(imageFile('image/gif'))).rejects.toThrow(
      'Choose a JPEG, PNG, or WebP image.',
    )

    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('rejects files over the maximum size', async () => {
    const oversized = new File(
      [new Uint8Array(MAX_AVATAR_FILE_SIZE + 1)],
      'large.png',
      { type: 'image/png' },
    )

    await expect(validateAvatarFile(oversized)).rejects.toThrow(
      `Choose an image smaller than ${MAX_AVATAR_FILE_SIZE / (1024 * 1024)} MB.`,
    )
  })

  it('rejects images whose decoded dimensions exceed the limit', async () => {
    mockDecodedImage(MAX_AVATAR_DIMENSION + 1, MAX_AVATAR_DIMENSION)

    await expect(validateAvatarFile(imageFile())).rejects.toThrow(
      `Choose an image no larger than ${MAX_AVATAR_DIMENSION} × ${MAX_AVATAR_DIMENSION} pixels.`,
    )
  })

  it('uploads valid images to the deterministic path with private non-cacheable metadata', async () => {
    vi.mocked(ref).mockReturnValue({ fullPath: 'avatars/user-123/avatar' } as never)
    vi.mocked(uploadBytes).mockResolvedValue({} as never)

    const avatar = await uploadAvatar('user-123', imageFile('image/webp'))

    expect(ref).toHaveBeenCalledWith(expect.anything(), 'avatars/user-123/avatar')
    expect(uploadBytes).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(File),
      {
        contentType: 'image/webp',
        cacheControl: 'private, max-age=0, no-store',
      },
    )
    expect(avatar).toEqual({
      storagePath: 'avatars/user-123/avatar',
      contentType: 'image/webp',
    })
  })

  it('propagates a failed deletion other than a missing object so removal can be retried', async () => {
    vi.mocked(ref).mockReturnValue({ fullPath: 'avatars/user-123/avatar' } as never)
    vi.mocked(deleteObject).mockRejectedValue({ code: 'storage/unauthorized' })

    await expect(removeAvatar('user-123')).rejects.toThrow(
      'Unable to remove the avatar. Please try again.',
    )
  })

  it('makes removal idempotent when the canonical object is already absent', async () => {
    vi.mocked(ref).mockReturnValue({ fullPath: 'avatars/user-123/avatar' } as never)
    vi.mocked(deleteObject).mockRejectedValue({ code: 'storage/object-not-found' })

    await expect(removeAvatar('user-123')).resolves.toBeUndefined()
    expect(deleteObject).toHaveBeenCalledWith(expect.anything())
  })
})

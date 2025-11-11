import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadRecipeImage, deleteRecipeImage } from './imageStorage'
import { uploadBytes, getDownloadURL, deleteObject, ref } from 'firebase/storage'

// Mock Firebase storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn()
}))

vi.mock('../config/firebase', () => ({
  storage: {}
}))

describe('imageStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadRecipeImage', () => {
    it('should upload image and return download URL', async () => {
      const mockDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      const mockRecipeId = 'recipe-123'
      const mockDownloadUrl = 'https://storage.googleapis.com/recipe-123/image.jpg'

      vi.mocked(ref).mockReturnValue({ toString: () => 'mock-ref' } as any)
      vi.mocked(uploadBytes).mockResolvedValue({} as any)
      vi.mocked(getDownloadURL).mockResolvedValue(mockDownloadUrl)

      const result = await uploadRecipeImage(mockDataUrl, mockRecipeId)

      expect(ref).toHaveBeenCalledWith(expect.anything(), `recipes/${mockRecipeId}/image.jpg`)
      expect(uploadBytes).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Blob),
        expect.objectContaining({
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000'
        })
      )
      expect(getDownloadURL).toHaveBeenCalled()
      expect(result).toBe(mockDownloadUrl)
    })

    it('should convert base64 data URL to Blob correctly', async () => {
      const mockDataUrl = 'data:image/png;base64,iVBORw0KGgo='
      const mockRecipeId = 'recipe-456'

      vi.mocked(ref).mockReturnValue({ toString: () => 'mock-ref' } as any)
      vi.mocked(uploadBytes).mockResolvedValue({} as any)
      vi.mocked(getDownloadURL).mockResolvedValue('https://example.com/image.jpg')

      await uploadRecipeImage(mockDataUrl, mockRecipeId)

      const uploadCall = vi.mocked(uploadBytes).mock.calls[0]
      const blob = uploadCall[1]
      
      expect(blob).toBeInstanceOf(Blob)
    })

    it('should handle upload errors', async () => {
      const mockDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      const mockRecipeId = 'recipe-789'

      vi.mocked(ref).mockReturnValue({ toString: () => 'mock-ref' } as any)
      vi.mocked(uploadBytes).mockRejectedValue(new Error('Upload failed'))

      await expect(uploadRecipeImage(mockDataUrl, mockRecipeId))
        .rejects.toThrow('Failed to upload image')
    })

    it('should use correct storage path format', async () => {
      const mockDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      const mockRecipeId = 'my-recipe-id'

      vi.mocked(ref).mockReturnValue({ toString: () => 'mock-ref' } as any)
      vi.mocked(uploadBytes).mockResolvedValue({} as any)
      vi.mocked(getDownloadURL).mockResolvedValue('https://example.com/image.jpg')

      await uploadRecipeImage(mockDataUrl, mockRecipeId)

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'recipes/my-recipe-id/image.jpg')
    })
  })

  describe('deleteRecipeImage', () => {
    it('should delete image from storage', async () => {
      const mockRecipeId = 'recipe-123'

      vi.mocked(ref).mockReturnValue({ toString: () => 'mock-ref' } as any)
      vi.mocked(deleteObject).mockResolvedValue(undefined)

      await deleteRecipeImage(mockRecipeId)

      expect(ref).toHaveBeenCalledWith(expect.anything(), `recipes/${mockRecipeId}/image.jpg`)
      expect(deleteObject).toHaveBeenCalled()
    })

    it('should not throw error if image does not exist', async () => {
      const mockRecipeId = 'recipe-456'

      vi.mocked(ref).mockReturnValue({ toString: () => 'mock-ref' } as any)
      vi.mocked(deleteObject).mockRejectedValue(new Error('Object not found'))

      // Should not throw
      await expect(deleteRecipeImage(mockRecipeId)).resolves.toBeUndefined()
    })

    it('should use correct storage path for deletion', async () => {
      const mockRecipeId = 'delete-this-recipe'

      vi.mocked(ref).mockReturnValue({ toString: () => 'mock-ref' } as any)
      vi.mocked(deleteObject).mockResolvedValue(undefined)

      await deleteRecipeImage(mockRecipeId)

      expect(ref).toHaveBeenCalledWith(expect.anything(), 'recipes/delete-this-recipe/image.jpg')
    })
  })
})

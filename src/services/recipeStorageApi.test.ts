import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteRecipe, updateRecipeSharing } from './recipeStorageApi'

// Mock dependencies using factory functions
vi.mock('../utils/imageStorage', () => ({
  deleteRecipeImage: vi.fn()
}))

vi.mock('axios', () => ({
  default: {
    delete: vi.fn(),
    patch: vi.fn()
  }
}))

vi.mock('../config/firebase', () => ({
  auth: {
    get currentUser() {
      return {
        getIdToken: vi.fn().mockResolvedValue('mock-token')
      }
    }
  }
}))

describe('recipeStorageApi - deleteRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deleteRecipe', () => {
    it('should delete recipe from backend and Firebase Storage', async () => {
      const axios = (await import('axios')).default
      const { deleteRecipeImage } = await import('../utils/imageStorage')

      vi.mocked(axios.delete).mockResolvedValue({})
      vi.mocked(deleteRecipeImage).mockResolvedValue(undefined)

      await deleteRecipe('recipe-123')

      // Verify backend deletion
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipes/recipe-123'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )

      // Verify image deletion
      expect(deleteRecipeImage).toHaveBeenCalledWith('recipe-123')
    })

    it('should still succeed even if image deletion fails', async () => {
      const axios = (await import('axios')).default
      const { deleteRecipeImage } = await import('../utils/imageStorage')

      vi.mocked(axios.delete).mockResolvedValue({})
      vi.mocked(deleteRecipeImage).mockRejectedValue(new Error('Image not found'))

      // Should not throw even if image deletion fails
      await expect(deleteRecipe('recipe-456')).resolves.toBeUndefined()

      // Backend deletion should still have been called
      expect(axios.delete).toHaveBeenCalled()
    })

    it('should delete image after backend deletion succeeds', async () => {
      const axios = (await import('axios')).default
      const { deleteRecipeImage } = await import('../utils/imageStorage')

      const callOrder: string[] = []

      vi.mocked(axios.delete).mockImplementation(async () => {
        callOrder.push('backend')
        return {}
      })
      vi.mocked(deleteRecipeImage).mockImplementation(async () => {
        callOrder.push('storage')
      })

      await deleteRecipe('recipe-999')

      // Verify order: backend first, then storage
      expect(callOrder).toEqual(['backend', 'storage'])
    })
  })

  describe('updateRecipeSharing', () => {
    it('should successfully update recipe sharing status', async () => {
      const axios = (await import('axios')).default
      
      const mockRecipe = {
        id: 'recipe-123',
        title: 'Test Recipe',
        isPublic: true
      }

      vi.mocked(axios.patch).mockResolvedValue({
        data: mockRecipe
      })

      const result = await updateRecipeSharing('recipe-123', true)

      // Verify API call
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipes/recipe-123/sharing'),
        { isPublic: true },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          })
        })
      )

      // Verify result
      expect(result).toEqual(mockRecipe)
    })

    it('should handle authentication errors', async () => {
      // Mock no authenticated user
      const mockFirebase = await import('../config/firebase')
      Object.defineProperty(mockFirebase.auth, 'currentUser', {
        get: vi.fn(() => null),
        configurable: true
      })

      await expect(updateRecipeSharing('recipe-123', true))
        .rejects
        .toThrow('User not authenticated')

      // Restore the mock
      Object.defineProperty(mockFirebase.auth, 'currentUser', {
        get: vi.fn(() => ({
          getIdToken: vi.fn().mockResolvedValue('mock-token')
        })),
        configurable: true
      })
    })

    it('should handle API errors', async () => {
      const axios = (await import('axios')).default
      
      const apiError = new Error('Internal server error')
      vi.mocked(axios.patch).mockRejectedValue(apiError)

      await expect(updateRecipeSharing('recipe-456', false))
        .rejects
        .toThrow('Internal server error')

      // Verify API was called
      expect(axios.patch).toHaveBeenCalled()
    })

    it('should include proper authorization header', async () => {
      const axios = (await import('axios')).default
      
      vi.mocked(axios.patch).mockResolvedValue({
        data: { id: 'recipe-789', isPublic: false }
      })

      await updateRecipeSharing('recipe-789', false)

      // Verify authorization header is present and correct
      expect(axios.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
    })
  })
})

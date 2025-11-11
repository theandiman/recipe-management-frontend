import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteRecipe } from './recipeStorageApi'

// Mock dependencies using factory functions
vi.mock('../utils/imageStorage', () => ({
  deleteRecipeImage: vi.fn()
}))

vi.mock('axios', () => ({
  default: {
    delete: vi.fn()
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
})

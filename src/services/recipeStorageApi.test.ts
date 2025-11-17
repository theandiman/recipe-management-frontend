import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteRecipe } from './recipeStorageApi'

// Mock dependencies using factory functions
vi.mock('../utils/imageStorage', () => ({
  deleteRecipeImage: vi.fn(),
  uploadRecipeImage: vi.fn()
}))

vi.mock('axios', () => ({
  default: {
    delete: vi.fn()
    , put: vi.fn()
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

describe('recipeStorageApi - updateRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call backend PUT with update payload and return updated recipe', async () => {
    const axios = (await import('axios')).default
    vi.mocked(axios.put).mockResolvedValue({ data: { id: 'updated-1', title: 'Updated' } })

    const { updateRecipe } = await import('./recipeStorageApi')

    const updated = await updateRecipe('updated-1', { title: 'Updated' })

    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/recipes/updated-1'),
      expect.objectContaining({ title: 'Updated' }),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Authorization': 'Bearer mock-token' })
      })
    )

    expect(updated).toEqual({ id: 'updated-1', title: 'Updated' })
  })

  it('should upload base64 image and include uploaded URL in update payload', async () => {
    const axios = (await import('axios')).default
    const { uploadRecipeImage } = await import('../utils/imageStorage')

    vi.mocked(uploadRecipeImage).mockResolvedValue('https://firebase.example/recipes/1/image.jpg')
    vi.mocked(axios.put).mockResolvedValue({ data: { id: 'updated-2', title: 'Updated with image', imageUrl: 'https://firebase.example/recipes/1/image.jpg' } })

    const { updateRecipe } = await import('./recipeStorageApi')

    const updated = await updateRecipe('updated-2', { title: 'Updated with image', imageUrl: 'data:image/png;base64,iVB...' })

    // Upload should have been called with recipe id
    expect(uploadRecipeImage).toHaveBeenCalledWith(expect.stringContaining('data:image/png;base64'), 'updated-2')

    // PUT should contain the upload url instead of base64 data URL
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/recipes/updated-2'),
      expect.objectContaining({ imageUrl: 'https://firebase.example/recipes/1/image.jpg' }),
      expect.any(Object)
    )

    expect(updated).toEqual(expect.objectContaining({ id: 'updated-2' }))
  })
})

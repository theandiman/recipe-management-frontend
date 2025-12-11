import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteRecipe, saveRecipe, getRecipes, getRecipe, updateRecipe } from './recipeStorageApi'
import type { Recipe } from '../types/nutrition'

// Mock dependencies using factory functions
vi.mock('../utils/imageStorage', () => ({
  deleteRecipeImage: vi.fn(),
  uploadRecipeImage: vi.fn()
}))

vi.mock('axios', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}))

vi.mock('../config/firebase', () => {
  const mockGetIdToken = vi.fn().mockResolvedValue('mock-token')
  return {
    auth: {
      get currentUser() {
        return {
          getIdToken: mockGetIdToken
        }
      }
    }
  }
})

vi.mock('../utils/authApi', () => ({
  postWithAuth: vi.fn()
}))

vi.mock('../utils/apiUtils', () => ({
  buildApiUrl: vi.fn((base: string, path: string) => `${base}${path}`)
}))

describe('recipeStorageApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRecipe = (overrides?: Partial<Recipe>): Recipe => ({
    id: 'test-recipe-id',
    userId: 'test-user-id',
    recipeName: 'Test Recipe',
    description: 'A test recipe',
    ingredients: ['ingredient 1', 'ingredient 2'],
    instructions: ['step 1', 'step 2'],
    servings: 4,
    source: 'ai-generated',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides
  })

  describe('saveRecipe', () => {
    it('should save recipe with authentication in normal mode', async () => {
      const { postWithAuth } = await import('../utils/authApi')
      const mockRecipe = createMockRecipe()
      const mockResponse = { data: { ...mockRecipe, id: 'saved-123' } }

      vi.mocked(postWithAuth).mockResolvedValue(mockResponse)

      const result = await saveRecipe(mockRecipe)

      expect(postWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipes'),
        expect.objectContaining({
          recipeName: 'Test Recipe',
          ingredients: mockRecipe.ingredients,
          instructions: mockRecipe.instructions
        })
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle recipe with prepTime and cookTime strings', async () => {
      const { postWithAuth } = await import('../utils/authApi')
      const mockRecipe = createMockRecipe({
        prepTime: '30 minutes',
        cookTime: '1 hour'
      })
      const mockResponse = { data: { ...mockRecipe, id: 'saved-123' } }

      vi.mocked(postWithAuth).mockResolvedValue(mockResponse)

      await saveRecipe(mockRecipe)

      expect(postWithAuth).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          prepTimeMinutes: 30,
          cookTimeMinutes: 60
        })
      )
    })

    it('should handle recipe with tips', async () => {
      const { postWithAuth } = await import('../utils/authApi')
      const mockRecipe = createMockRecipe({
        tips: {
          substitutions: ['sub 1', 'sub 2'],
          makeAhead: 'Can be made ahead',
          storage: 'Store in fridge',
          reheating: 'Reheat in oven',
          variations: ['var 1']
        }
      })
      const mockResponse = { data: { ...mockRecipe, id: 'saved-123' } }

      vi.mocked(postWithAuth).mockResolvedValue(mockResponse)

      await saveRecipe(mockRecipe)

      expect(postWithAuth).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tips: {
            substitutions: ['sub 1', 'sub 2'],
            makeAhead: 'Can be made ahead',
            storage: 'Store in fridge',
            reheating: 'Reheat in oven',
            variations: ['var 1']
          }
        })
      )
    })

    it('should upload base64 image to Firebase Storage before saving', async () => {
      const { postWithAuth } = await import('../utils/authApi')
      const { uploadRecipeImage } = await import('../utils/imageStorage')
      
      const mockRecipe = createMockRecipe({
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
      })
      const mockStorageUrl = 'https://storage.googleapis.com/recipe-image.png'
      const mockResponse = { data: { ...mockRecipe, id: 'saved-123', imageUrl: mockStorageUrl } }

      vi.mocked(uploadRecipeImage).mockResolvedValue(mockStorageUrl)
      vi.mocked(postWithAuth).mockResolvedValue(mockResponse)

      await saveRecipe(mockRecipe)

      expect(uploadRecipeImage).toHaveBeenCalledWith(
        mockRecipe.imageUrl,
        expect.stringContaining('temp-')
      )
      expect(postWithAuth).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          imageUrl: mockStorageUrl
        })
      )
    })

    it('should handle image upload failure gracefully', async () => {
      const { postWithAuth } = await import('../utils/authApi')
      const { uploadRecipeImage } = await import('../utils/imageStorage')
      
      const mockRecipe = createMockRecipe({
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
      })
      const mockResponse = { data: { ...mockRecipe, id: 'saved-123' } }

      vi.mocked(uploadRecipeImage).mockRejectedValue(new Error('Upload failed'))
      vi.mocked(postWithAuth).mockResolvedValue(mockResponse)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await saveRecipe(mockRecipe)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to upload image, saving recipe without image:',
        expect.any(Error)
      )
      expect(postWithAuth).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          imageUrl: undefined
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('getRecipes', () => {
    it('should fetch all recipes with authentication', async () => {
      const axios = (await import('axios')).default
      const mockRecipes = [createMockRecipe(), createMockRecipe({ id: 'recipe-2' })]
      
      vi.mocked(axios.get).mockResolvedValue({ data: mockRecipes })

      const result = await getRecipes()

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipes'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
      expect(result).toEqual(mockRecipes)
    })
  })

  describe('getRecipe', () => {
    it('should fetch a single recipe by ID', async () => {
      const axios = (await import('axios')).default
      const mockRecipe = createMockRecipe()
      
      vi.mocked(axios.get).mockResolvedValue({ data: mockRecipe })

      const result = await getRecipe('test-recipe-id')

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipes/test-recipe-id'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
      expect(result).toEqual(mockRecipe)
    })
  })

  describe('updateRecipe', () => {
    it('should update recipe with authentication', async () => {
      const axios = (await import('axios')).default
      const mockRecipe = createMockRecipe()
      
      vi.mocked(axios.put).mockResolvedValue({ data: mockRecipe })

      const result = await updateRecipe('test-recipe-id', mockRecipe)

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipes/test-recipe-id'),
        expect.objectContaining({
          recipeName: 'Test Recipe'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
      expect(result).toEqual(mockRecipe)
    })

    it('should upload base64 image using recipe ID before updating', async () => {
      const axios = (await import('axios')).default
      const { uploadRecipeImage } = await import('../utils/imageStorage')
      
      const mockRecipe = createMockRecipe({
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
      })
      const mockStorageUrl = 'https://storage.googleapis.com/recipe-image.png'

      vi.mocked(uploadRecipeImage).mockResolvedValue(mockStorageUrl)
      vi.mocked(axios.put).mockResolvedValue({ data: mockRecipe })

      await updateRecipe('recipe-123', mockRecipe)

      expect(uploadRecipeImage).toHaveBeenCalledWith(
        mockRecipe.imageUrl,
        'recipe-123'
      )
      expect(axios.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          imageUrl: mockStorageUrl
        }),
        expect.any(Object)
      )
    })

    it('should handle image upload failure during update gracefully', async () => {
      const axios = (await import('axios')).default
      const { uploadRecipeImage } = await import('../utils/imageStorage')
      
      const mockRecipe = createMockRecipe({
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
      })

      vi.mocked(uploadRecipeImage).mockRejectedValue(new Error('Upload failed'))
      vi.mocked(axios.put).mockResolvedValue({ data: mockRecipe })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await updateRecipe('recipe-123', mockRecipe)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to upload image, updating recipe without new image:',
        expect.any(Error)
      )
      expect(axios.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          imageUrl: undefined
        }),
        expect.any(Object)
      )

      consoleErrorSpy.mockRestore()
    })
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

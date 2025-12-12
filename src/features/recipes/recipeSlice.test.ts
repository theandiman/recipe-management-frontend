import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import axios from 'axios'
import recipeReducer, { generateRecipe, generateImage, clearImage, clearRecipe } from './recipeSlice'
import * as authApi from '../../utils/authApi'

// Mock modules
vi.mock('axios')
vi.mock('../../utils/authApi')

describe('recipeSlice', () => {
  const initialState = {
    loading: false,
    result: null,
    error: null,
    imageUrl: null,
    imageLoading: false,
    imageError: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Set default environment variable
    import.meta.env.VITE_API_URL = 'https://api.example.com'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial state', () => {
    const state = recipeReducer(undefined, { type: 'unknown' })
    expect(state).toEqual(initialState)
  })

  it('should handle generateRecipe.pending', () => {
    const state = recipeReducer(undefined, generateRecipe.pending('', { prompt: '', pantryItems: [] }))
    expect(state.loading).toBe(true)
    expect(state.error).toBe(null)
    expect(state.imageUrl).toBe(null)
    expect(state.imageError).toBe(null)
    expect(state.imageLoading).toBe(false)
  })

  it('should handle generateRecipe.fulfilled with string', () => {
    const state = recipeReducer(
      undefined,
      generateRecipe.fulfilled('{"recipeName": "Test"}', '', { prompt: '', pantryItems: [] })
    )
    expect(state.loading).toBe(false)
    expect(state.result).toBe('{"recipeName": "Test"}')
    expect(state.error).toBe(null)
  })

  it('should handle generateRecipe.fulfilled with object', () => {
    const payload = { recipeName: 'Test Recipe' }
    const state = recipeReducer(
      undefined,
      generateRecipe.fulfilled(payload as any, '', { prompt: '', pantryItems: [] })
    )
    expect(state.loading).toBe(false)
    expect(state.result).toBe(JSON.stringify(payload))
  })

  it('should handle generateRecipe.rejected with error message', () => {
    const state = recipeReducer(
      undefined,
      generateRecipe.rejected(new Error('Test error'), '', { prompt: '', pantryItems: [] })
    )
    expect(state.loading).toBe(false)
    expect(state.error).toBe('Test error')
  })

  it('should handle generateRecipe.rejected without error message', () => {
    const action = generateRecipe.rejected(new Error(), '', { prompt: '', pantryItems: [] })
    const state = recipeReducer(undefined, action)
    expect(state.loading).toBe(false)
    expect(state.error).toBeDefined()
  })

  it('should handle generateImage.pending', () => {
    const state = recipeReducer(undefined, generateImage.pending('', { prompt: 'test' }))
    expect(state.imageLoading).toBe(true)
    expect(state.imageError).toBe(null)
  })

  it('should handle generateImage.fulfilled with imageUrl', () => {
    const payload = { imageUrl: 'https://example.com/image.jpg' }
    const state = recipeReducer(
      undefined,
      generateImage.fulfilled(payload as any, '', { prompt: 'test' })
    )
    expect(state.imageLoading).toBe(false)
    expect(state.imageUrl).toBe('https://example.com/image.jpg')
    expect(state.imageError).toBe(null)
  })

  it('should handle generateImage.fulfilled with image field', () => {
    const payload = { image: 'https://example.com/photo.png' }
    const state = recipeReducer(
      undefined,
      generateImage.fulfilled(payload as any, '', { prompt: 'test' })
    )
    expect(state.imageLoading).toBe(false)
    expect(state.imageUrl).toBe('https://example.com/photo.png')
  })

  it('should handle generateImage.rejected', () => {
    const state = recipeReducer(
      undefined,
      generateImage.rejected(new Error('Image error'), '', { prompt: 'test' })
    )
    expect(state.imageLoading).toBe(false)
    expect(state.imageError).toBe('Image error')
  })

  it('should handle generateImage.rejected when cancelled', () => {
    const action = generateImage.rejected(new Error('cancelled'), '', { prompt: 'test' })
    // @ts-ignore - setting payload for test
    action.payload = 'cancelled'
    const state = recipeReducer(undefined, action)
    expect(state.imageLoading).toBe(false)
    expect(state.imageError).toBe(null)
  })

  it('should handle clearImage', () => {
    const state = recipeReducer(
      { ...initialState, imageUrl: 'test.jpg', imageLoading: true, imageError: 'error', result: 'recipe' },
      clearImage()
    )
    expect(state.imageUrl).toBe(null)
    expect(state.imageLoading).toBe(false)
    expect(state.imageError).toBe(null)
    expect(state.result).toBe('recipe') // Should preserve recipe
  })

  it('should handle clearRecipe', () => {
    const state = recipeReducer(
      { loading: true, result: 'recipe', error: 'error', imageUrl: 'url', imageLoading: true, imageError: 'img error' },
      clearRecipe()
    )
    expect(state).toEqual(initialState)
  })

  describe('generateRecipe async thunk', () => {
    it('should successfully generate recipe', async () => {
      const mockRecipe = { recipeName: 'Pasta Carbonara', ingredients: ['pasta', 'eggs'] }
      vi.mocked(authApi.postWithAuth).mockResolvedValue({ data: mockRecipe })

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      const payload = {
        prompt: 'Italian pasta',
        pantryItems: ['pasta', 'eggs'],
        units: 'metric',
        dietaryPreferences: ['vegetarian'],
        allergies: ['nuts'],
        maxTotalMinutes: 60
      }

      await store.dispatch(generateRecipe(payload))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.result).toBe(JSON.stringify(mockRecipe))
      expect(state.error).toBe(null)
      expect(authApi.postWithAuth).toHaveBeenCalledWith(
        'https://api.example.com/api/recipes/generate',
        payload
      )
    })

    it('should handle axios error with string response', async () => {
      const errorMessage = 'Recipe generation failed'
      const axiosError = {
        isAxiosError: true,
        response: {
          data: errorMessage
        }
      }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(axiosError)
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateRecipe({ prompt: 'test', pantryItems: [] }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })

    it('should handle axios error with object response', async () => {
      const errorData = { message: 'Invalid request', code: 'INVALID_PROMPT' }
      const axiosError = {
        isAxiosError: true,
        response: {
          data: errorData
        }
      }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(axiosError)
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateRecipe({ prompt: 'test', pantryItems: [] }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe(JSON.stringify(errorData))
    })

    it('should handle axios error with non-serializable response', async () => {
      const circularObj: any = { prop: 'value' }
      circularObj.self = circularObj // Create circular reference
      const axiosError = {
        isAxiosError: true,
        response: {
          data: circularObj
        }
      }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(axiosError)
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateRecipe({ prompt: 'test', pantryItems: [] }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toContain('object')
    })

    it('should handle non-axios error', async () => {
      const error = new Error('Network failure')
      vi.mocked(authApi.postWithAuth).mockRejectedValue(error)
      vi.mocked(axios.isAxiosError).mockReturnValue(false)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateRecipe({ prompt: 'test', pantryItems: [] }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network failure')
    })

    it('should handle error without message', async () => {
      const error = { toString: () => 'Unknown error' }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(error)
      vi.mocked(axios.isAxiosError).mockReturnValue(false)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateRecipe({ prompt: 'test', pantryItems: [] }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Failed to generate recipe')
    })
  })

  describe('generateImage async thunk', () => {
    it('should successfully generate image with prompt', async () => {
      const mockImageData = { imageUrl: 'https://example.com/generated-image.jpg' }
      vi.mocked(authApi.postWithAuth).mockResolvedValue({ data: mockImageData })

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      const payload = { prompt: 'delicious pasta dish' }

      await store.dispatch(generateImage(payload))

      const state = store.getState().recipe
      expect(state.imageLoading).toBe(false)
      expect(state.imageUrl).toBe('https://example.com/generated-image.jpg')
      expect(state.imageError).toBe(null)
      expect(authApi.postWithAuth).toHaveBeenCalledWith(
        'https://api.example.com/api/recipes/image/generate',
        payload,
        { signal: expect.any(AbortSignal) }
      )
    })

    it('should successfully generate image with recipe object', async () => {
      const mockImageData = { image: 'https://example.com/recipe-photo.png' }
      const recipe = { recipeName: 'Test Recipe', ingredients: [] } as any
      vi.mocked(authApi.postWithAuth).mockResolvedValue({ data: mockImageData })

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateImage({ recipe }))

      const state = store.getState().recipe
      expect(state.imageUrl).toBe('https://example.com/recipe-photo.png')
    })

    it('should handle cancelled request', async () => {
      const cancelError = new Error('Request cancelled')
      vi.mocked(authApi.postWithAuth).mockRejectedValue(cancelError)
      vi.mocked(axios.isCancel).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateImage({ prompt: 'test' }))

      const state = store.getState().recipe
      expect(state.imageLoading).toBe(false)
      expect(state.imageError).toBe(null) // Should not set error when cancelled
    })

    it('should handle axios error with string response', async () => {
      const errorMessage = 'Image generation failed'
      const axiosError = {
        isAxiosError: true,
        response: {
          data: errorMessage
        }
      }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(axiosError)
      vi.mocked(axios.isCancel).mockReturnValue(false)
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateImage({ prompt: 'test' }))

      const state = store.getState().recipe
      expect(state.imageLoading).toBe(false)
      expect(state.imageError).toBe(errorMessage)
    })

    it('should handle axios error with object response', async () => {
      const errorData = { error: 'Invalid image prompt', details: 'Too short' }
      const axiosError = {
        isAxiosError: true,
        response: {
          data: errorData
        }
      }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(axiosError)
      vi.mocked(axios.isCancel).mockReturnValue(false)
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateImage({ prompt: 'test' }))

      const state = store.getState().recipe
      expect(state.imageError).toBe(JSON.stringify(errorData))
    })

    it('should handle axios error with non-serializable response', async () => {
      const circularObj: any = { error: 'test' }
      circularObj.circular = circularObj
      const axiosError = {
        isAxiosError: true,
        response: {
          data: circularObj
        }
      }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(axiosError)
      vi.mocked(axios.isCancel).mockReturnValue(false)
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateImage({ prompt: 'test' }))

      const state = store.getState().recipe
      expect(state.imageError).toContain('object')
    })

    it('should handle non-axios error', async () => {
      const error = new Error('Network timeout')
      vi.mocked(authApi.postWithAuth).mockRejectedValue(error)
      vi.mocked(axios.isCancel).mockReturnValue(false)
      vi.mocked(axios.isAxiosError).mockReturnValue(false)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateImage({ prompt: 'test' }))

      const state = store.getState().recipe
      expect(state.imageError).toBe('Network timeout')
    })

    it('should handle error without message', async () => {
      const error = { toString: () => 'Unknown' }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(error)
      vi.mocked(axios.isCancel).mockReturnValue(false)
      vi.mocked(axios.isAxiosError).mockReturnValue(false)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateImage({ prompt: 'test' }))

      const state = store.getState().recipe
      expect(state.imageError).toBe('Failed to generate image')
    })
  })
})

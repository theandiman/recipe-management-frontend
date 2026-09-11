import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import axios from 'axios'
import recipeReducer, {
  generateRecipe,
  remixRecipe,
  modifyRecipe,
  generateImage,
  clearImage,
  clearRecipe
} from './recipeSlice'
import * as authApi from '../../utils/authApi'
import type { Recipe } from '../../types/nutrition'

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
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    vi.mocked(axios.isCancel).mockReturnValue(false)
    vi.mocked(axios.isAxiosError).mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
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
      vi.mocked(authApi.postWithAuth).mockResolvedValue({ 
        data: mockRecipe,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      })

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
        payload,
        { signal: expect.any(AbortSignal) }
      )
    })

    it('prefers VITE_AI_API_URL when generating recipes', async () => {
      vi.mocked(authApi.postWithAuth).mockResolvedValue({
        data: { recipeName: 'AI Recipe' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      })
      vi.stubEnv('VITE_AI_API_URL', 'https://ai.example.com')

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      const payload = { prompt: 'test', pantryItems: [] }

      await store.dispatch(generateRecipe(payload))

      expect(authApi.postWithAuth).toHaveBeenCalledWith(
        'https://ai.example.com/api/recipes/generate',
        payload,
        { signal: expect.any(AbortSignal) }
      )
    })

    it('should handle cancelled recipe generation requests', async () => {
      const cancelError = new Error('Request cancelled')
      vi.mocked(authApi.postWithAuth).mockRejectedValue(cancelError)
      vi.mocked(axios.isCancel).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(generateRecipe({ prompt: 'test', pantryItems: [] }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
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
      vi.mocked(authApi.postWithAuth).mockResolvedValue({ 
        data: mockImageData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      })

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

    it('prefers VITE_AI_API_URL when generating images', async () => {
      vi.mocked(authApi.postWithAuth).mockResolvedValue({
        data: { imageUrl: 'https://example.com/generated-image.jpg' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      })
      vi.stubEnv('VITE_AI_API_URL', 'https://ai.example.com')

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      const payload = { prompt: 'test' }

      await store.dispatch(generateImage(payload))

      expect(authApi.postWithAuth).toHaveBeenCalledWith(
        'https://ai.example.com/api/recipes/image/generate',
        payload,
        { signal: expect.any(AbortSignal) }
      )
    })

    it('should successfully generate image with recipe object', async () => {
      const mockImageData = { image: 'https://example.com/recipe-photo.png' }
      const recipe = { recipeName: 'Test Recipe', ingredients: [] } as any
      vi.mocked(authApi.postWithAuth).mockResolvedValue({ 
        data: mockImageData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      })

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

  describe('remixRecipe async thunk', () => {
    const mockCurrentRecipe = {
      recipeName: 'Pancakes',
      ingredients: ['flour', 'milk', 'egg'],
      instructions: ['Mix', 'Cook']
    } as unknown as Recipe

    it('exports modifyRecipe as an alias for remixRecipe', () => {
      expect(modifyRecipe).toBe(remixRecipe)
    })

    it('should handle remixRecipe.pending', () => {
      const state = recipeReducer(
        undefined,
        remixRecipe.pending('', { currentRecipe: mockCurrentRecipe, instruction: 'Make vegan' })
      )
      expect(state.loading).toBe(true)
      expect(state.error).toBe(null)
    })

    it('should handle remixRecipe.fulfilled', () => {
      const modifiedRecipe = { ...mockCurrentRecipe, recipeName: 'Vegan Pancakes' }
      const state = recipeReducer(
        undefined,
        remixRecipe.fulfilled(modifiedRecipe, '', { currentRecipe: mockCurrentRecipe, instruction: 'Make vegan' })
      )
      expect(state.loading).toBe(false)
      expect(state.result).toBe(JSON.stringify(modifiedRecipe))
      expect(state.error).toBe(null)
    })

    it('should handle remixRecipe.rejected', () => {
      const state = recipeReducer(
        undefined,
        remixRecipe.rejected(new Error('Remix failed'), '', { currentRecipe: mockCurrentRecipe, instruction: 'Make vegan' })
      )
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Remix failed')
    })

    it('should post structured payload to /api/recipes/modify and trim instruction', async () => {
      const modifiedRecipe = { recipeName: 'Vegan Pancakes', ingredients: ['flour', 'oat milk'] }
      vi.mocked(authApi.postWithAuth).mockResolvedValue({
        data: modifiedRecipe,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as unknown as Parameters<typeof authApi.postWithAuth>[2]
      } as unknown as Awaited<ReturnType<typeof authApi.postWithAuth>>)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(remixRecipe({
        currentRecipe: mockCurrentRecipe,
        instruction: '  Make it vegan!  '
      }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.result).toBe(JSON.stringify(modifiedRecipe))
      expect(state.error).toBe(null)
      expect(authApi.postWithAuth).toHaveBeenCalledWith(
        'https://api.example.com/api/recipes/modify',
        {
          currentRecipe: mockCurrentRecipe,
          instruction: 'Make it vegan!'
        },
        { signal: expect.any(AbortSignal) }
      )
    })

    it('prefers VITE_AI_API_URL when remixing recipes', async () => {
      vi.mocked(authApi.postWithAuth).mockResolvedValue({
        data: { recipeName: 'Remixed' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as unknown as Parameters<typeof authApi.postWithAuth>[2]
      } as unknown as Awaited<ReturnType<typeof authApi.postWithAuth>>)
      vi.stubEnv('VITE_AI_API_URL', 'https://ai.example.com')

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(remixRecipe({
        currentRecipe: mockCurrentRecipe,
        instruction: 'Less salt'
      }))

      expect(authApi.postWithAuth).toHaveBeenCalledWith(
        'https://ai.example.com/api/recipes/modify',
        {
          currentRecipe: mockCurrentRecipe,
          instruction: 'Less salt'
        },
        { signal: expect.any(AbortSignal) }
      )
    })

    it('should handle cancelled remix requests', async () => {
      vi.mocked(authApi.postWithAuth).mockRejectedValue(new Error('cancelled'))
      vi.mocked(axios.isCancel).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(remixRecipe({
        currentRecipe: mockCurrentRecipe,
        instruction: 'Faster'
      }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
    })

    it('should handle axios error responses', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: { error: 'Validation failed' }
        }
      }
      vi.mocked(authApi.postWithAuth).mockRejectedValue(axiosError)
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(remixRecipe({
        currentRecipe: mockCurrentRecipe,
        instruction: 'Bad request'
      }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe(JSON.stringify({ error: 'Validation failed' }))
    })

    it('should reject early when instruction is empty or whitespace-only without calling API', async () => {
      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(remixRecipe({
        currentRecipe: mockCurrentRecipe,
        instruction: '   '
      }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Instruction cannot be empty')
      expect(authApi.postWithAuth).not.toHaveBeenCalled()
    })

    it('should reject early when currentRecipe is missing without calling API', async () => {
      const store = configureStore({ reducer: { recipe: recipeReducer } })
      await store.dispatch(remixRecipe({
        currentRecipe: null as unknown as Recipe,
        instruction: 'Make vegan'
      }))

      const state = store.getState().recipe
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Current recipe is required for modification')
      expect(authApi.postWithAuth).not.toHaveBeenCalled()
    })
  })
})

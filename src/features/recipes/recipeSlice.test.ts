import { describe, it, expect } from 'vitest'
import recipeReducer, { generateRecipe, generateImage, clearImage, clearRecipe } from './recipeSlice'

describe('recipeSlice', () => {
  const initialState = {
    loading: false,
    result: null,
    error: null,
    imageUrl: null,
    imageLoading: false,
    imageError: null
  }

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
})

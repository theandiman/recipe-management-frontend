import { describe, it, expect } from 'vitest'
import recipeReducer, { generateRecipe, generateImage, clearImage } from './recipeSlice'

describe('recipeSlice', () => {
  it('should return initial state', () => {
    const state = recipeReducer(undefined, { type: 'unknown' })
    expect(state).toEqual({
      loading: false,
      result: null,
      error: null,
      imageUrl: null,
      imageLoading: false,
      imageError: null
    })
  })

  it('should handle generateRecipe.pending', () => {
    const state = recipeReducer(undefined, generateRecipe.pending('', { prompt: '', pantryItems: [] }))
    expect(state.loading).toBe(true)
    expect(state.error).toBe(null)
  })

  it('should handle generateRecipe.fulfilled', () => {
    const state = recipeReducer(
      undefined,
      generateRecipe.fulfilled('{"recipeName": "Test"}', '', { prompt: '', pantryItems: [] })
    )
    expect(state.loading).toBe(false)
    expect(state.result).toBe('{"recipeName": "Test"}')
  })

  it('should handle generateRecipe.rejected', () => {
    const state = recipeReducer(
      undefined,
      generateRecipe.rejected(new Error('Test error'), '', { prompt: '', pantryItems: [] })
    )
    expect(state.loading).toBe(false)
    expect(state.error).toBe('Test error')
  })

  it('should handle generateImage.pending', () => {
    const state = recipeReducer(undefined, generateImage.pending('', { prompt: 'test' }))
    expect(state.imageLoading).toBe(true)
    expect(state.imageError).toBe(null)
  })

  it('should handle clearImage', () => {
    const state = recipeReducer(
      { loading: false, result: null, error: null, imageUrl: 'test.jpg', imageLoading: false, imageError: null },
      clearImage()
    )
    expect(state.imageUrl).toBe(null)
  })
})

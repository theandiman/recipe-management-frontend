import { describe, it, expect } from 'vitest'
import { store } from './store'

describe('Redux Store', () => {
  it('should initialize with default state', () => {
    const state = store.getState()
    
    expect(state.recipe).toBeDefined()
    expect(state.recipe.loading).toBe(false)
    expect(state.recipe.result).toBe(null)
  })

  it('should have recipe reducer', () => {
    const state = store.getState()
    expect(state.recipe).toEqual({
      loading: false,
      result: null,
      error: null,
      imageUrl: null,
      imageLoading: false,
      imageError: null
    })
  })
})

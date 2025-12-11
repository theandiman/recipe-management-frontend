import { describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { AIGenerator } from './AIGenerator'
import recipeReducer from './recipeSlice'

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      recipe: recipeReducer
    },
    preloadedState: {
      recipe: {
        loading: false,
        result: null,
        error: null,
        imageUrl: null,
        imageLoading: false,
        imageError: null,
        ...initialState
      }
    }
  })
}

describe('AIGenerator', () => {
  it('should render generator form', () => {
    const store = createMockStore()

    render(
      <Provider store={store}>
        <AIGenerator />
      </Provider>
    )

    screen.getByPlaceholderText(/describe your ideal recipe/i)
  })

  it('should render loading state', () => {
    const store = createMockStore({ loading: true })

    render(
      <Provider store={store}>
        <AIGenerator />
      </Provider>
    )

    screen.getByText(/generating/i)
  })

  it('should render error state', () => {
    const store = createMockStore({ error: 'Generation failed' })

    render(
      <Provider store={store}>
        <AIGenerator />
      </Provider>
    )

    screen.getByText(/generation failed/i)
  })
})

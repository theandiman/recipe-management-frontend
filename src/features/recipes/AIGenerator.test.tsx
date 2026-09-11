import { describe, it, vi, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'
import { AIGenerator } from './AIGenerator'
import recipeReducer from './recipeSlice'

const createMockStore = () =>
  configureStore({
    reducer: {
      recipe: recipeReducer,
    },
    preloadedState: {
      recipe: {
        recipes: [],
        currentRecipe: null,
        loading: false,
        aiLoading: false,
        error: null,
        auditLogs: [],
        result: null,
        imageUrl: null,
        imageLoading: false,
        imageError: null,
      },
    },
  })

vi.mock('../../config/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}))

describe('AIGenerator Component', () => {
  let store: ReturnType<typeof createMockStore>

  beforeEach(() => {
    store = createMockStore()
  })

  it('renders AI Recipe Generator title and dietary buttons', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <AIGenerator />
        </BrowserRouter>
      </Provider>
    )

    expect(screen.getByText(/AI Recipe Generator/i)).toBeDefined()
    expect(screen.getByText(/Scan Fridge \/ Pantry/i)).toBeDefined()
    expect(screen.getByText(/Vegetarian/i)).toBeDefined()
    expect(screen.getByText(/Vegan/i)).toBeDefined()
  })

  it('allows typing into the prompt textarea', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <AIGenerator />
        </BrowserRouter>
      </Provider>
    )

    const textarea = screen.getByPlaceholderText(/a quick weeknight dinner/i)
    fireEvent.change(textarea, { target: { value: 'Crispy Garlic Butter Salmon' } })

    expect((textarea as HTMLTextAreaElement).value).toBe('Crispy Garlic Butter Salmon')
  })

  it('renders recipe and displays error when remix fails', () => {
    const customStore = configureStore({
      reducer: {
        recipe: recipeReducer,
      },
      preloadedState: {
        recipe: {
          recipes: [],
          currentRecipe: null,
          loading: false,
          aiLoading: false,
          error: 'Failed to remix recipe due to network error',
          auditLogs: [],
          result: JSON.stringify({
            recipeName: 'Remixable Stew',
            description: 'A hearty beef stew',
            ingredients: ['1 lb beef', '2 carrots'],
            instructions: ['Brown beef', 'Simmer with carrots'],
          }),
          imageUrl: null,
          imageLoading: false,
          imageError: null,
        },
      },
    })

    render(
      <Provider store={customStore}>
        <BrowserRouter>
          <AIGenerator />
        </BrowserRouter>
      </Provider>
    )

    expect(screen.getByText('Remixable Stew')).toBeDefined()
    expect(screen.getByText(/Failed to remix recipe due to network error/i)).toBeDefined()
  })

  it('does not dispatch remixRecipe when custom instruction is whitespace only', () => {
    const customStore = configureStore({
      reducer: {
        recipe: recipeReducer,
      },
      preloadedState: {
        recipe: {
          recipes: [],
          currentRecipe: null,
          loading: false,
          aiLoading: false,
          error: null,
          auditLogs: [],
          result: JSON.stringify({
            recipeName: 'Remixable Stew',
            ingredients: ['1 lb beef'],
            instructions: ['Brown beef'],
          }),
          imageUrl: null,
          imageLoading: false,
          imageError: null,
        },
      },
    })

    const dispatchSpy = vi.spyOn(customStore, 'dispatch')

    render(
      <Provider store={customStore}>
        <BrowserRouter>
          <AIGenerator />
        </BrowserRouter>
      </Provider>
    )

    const input = screen.getByPlaceholderText(/Use coconut milk instead of cream/i)
    fireEvent.change(input, { target: { value: '   ' } })
    const remixButton = screen.getByRole('button', { name: /Remix/i })
    fireEvent.click(remixButton)

    expect(dispatchSpy).not.toHaveBeenCalled()
  })
})

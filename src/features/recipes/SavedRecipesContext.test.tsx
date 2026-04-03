import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { SavedRecipesProvider, useSavedRecipes } from './SavedRecipesContext'
import type { Recipe } from '../../types/nutrition'

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock API functions
const mockGetSavedRecipes = vi.fn()
const mockBookmarkRecipe = vi.fn()
const mockUnbookmarkRecipe = vi.fn()
vi.mock('../../services/recipeStorageApi', () => ({
  getSavedRecipes: () => mockGetSavedRecipes(),
  bookmarkRecipe: (id: string) => mockBookmarkRecipe(id),
  unbookmarkRecipe: (id: string) => mockUnbookmarkRecipe(id)
}))

const mockRecipe: Recipe = {
  id: 'recipe-1',
  recipeName: 'Chocolate Cake',
  ingredients: ['flour', 'sugar'],
  instructions: ['Mix', 'Bake'],
  servings: 8,
  source: 'manual'
}

const mockRecipe2: Recipe = {
  id: 'recipe-2',
  recipeName: 'Pasta Carbonara',
  ingredients: ['pasta', 'eggs'],
  instructions: ['Cook', 'Mix'],
  servings: 4,
  source: 'manual'
}

/** Simple consumer component that exposes the context API via data-testid elements */
const TestConsumer = () => {
  const { savedRecipes, savedIds, isLoading, isSaved, toggleSave, reload } = useSavedRecipes()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="count">{savedRecipes.length}</div>
      <div data-testid="is-saved-r1">{isSaved('recipe-1') ? 'true' : 'false'}</div>
      <div data-testid="saved-ids">{[...savedIds].join(',')}</div>
      <button onClick={() => toggleSave(mockRecipe)}>Toggle R1</button>
      <button onClick={() => reload()}>Reload</button>
    </div>
  )
}

const renderProvider = () =>
  render(
    <SavedRecipesProvider>
      <TestConsumer />
    </SavedRecipesProvider>
  )

describe('SavedRecipesContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockGetSavedRecipes.mockResolvedValue([])
    mockBookmarkRecipe.mockResolvedValue(undefined)
    mockUnbookmarkRecipe.mockResolvedValue(undefined)
  })

  it('throws when useSavedRecipes is used outside SavedRecipesProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      'useSavedRecipes must be used within a SavedRecipesProvider'
    )
    consoleError.mockRestore()
  })

  it('starts with empty saved recipes', async () => {
    renderProvider()
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0')
    })
  })

  it('fetches saved recipes on mount when authenticated', async () => {
    mockGetSavedRecipes.mockResolvedValue([mockRecipe])
    renderProvider()
    await waitFor(() => {
      expect(mockGetSavedRecipes).toHaveBeenCalledOnce()
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })
  })

  it('does not fetch recipes when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    renderProvider()
    expect(mockGetSavedRecipes).not.toHaveBeenCalled()
  })

  it('clears saved recipes when user logs out', async () => {
    mockGetSavedRecipes.mockResolvedValue([mockRecipe])
    const { rerender } = renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })

    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    rerender(
      <SavedRecipesProvider>
        <TestConsumer />
      </SavedRecipesProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0')
    })
  })

  it('isSaved returns false for unsaved recipes', async () => {
    mockGetSavedRecipes.mockResolvedValue([])
    renderProvider()
    await waitFor(() => {
      expect(screen.getByTestId('is-saved-r1')).toHaveTextContent('false')
    })
  })

  it('isSaved returns true for saved recipes', async () => {
    mockGetSavedRecipes.mockResolvedValue([mockRecipe])
    renderProvider()
    await waitFor(() => {
      expect(screen.getByTestId('is-saved-r1')).toHaveTextContent('true')
    })
  })

  it('savedIds contains the ids of saved recipes', async () => {
    mockGetSavedRecipes.mockResolvedValue([mockRecipe, mockRecipe2])
    renderProvider()
    await waitFor(() => {
      const savedIds = screen.getByTestId('saved-ids').textContent
      expect(savedIds).toContain('recipe-1')
      expect(savedIds).toContain('recipe-2')
    })
  })

  describe('toggleSave', () => {
    it('optimistically adds recipe when bookmarking', async () => {
      mockGetSavedRecipes.mockResolvedValue([])
      mockBookmarkRecipe.mockResolvedValue(undefined)
      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0')
      })

      await act(async () => {
        screen.getByText('Toggle R1').click()
      })

      expect(screen.getByTestId('count')).toHaveTextContent('1')
      expect(screen.getByTestId('is-saved-r1')).toHaveTextContent('true')
      expect(mockBookmarkRecipe).toHaveBeenCalledWith('recipe-1')
    })

    it('optimistically removes recipe when unbookmarking', async () => {
      mockGetSavedRecipes.mockResolvedValue([mockRecipe])
      mockUnbookmarkRecipe.mockResolvedValue(undefined)
      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('is-saved-r1')).toHaveTextContent('true')
      })

      await act(async () => {
        screen.getByText('Toggle R1').click()
      })

      expect(screen.getByTestId('is-saved-r1')).toHaveTextContent('false')
      expect(mockUnbookmarkRecipe).toHaveBeenCalledWith('recipe-1')
    })

    it('rolls back optimistic add when bookmarkRecipe fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetSavedRecipes.mockResolvedValue([])
      mockBookmarkRecipe.mockRejectedValue(new Error('Network error'))
      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0')
      })

      await act(async () => {
        screen.getByText('Toggle R1').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0')
      })
      consoleError.mockRestore()
    })

    it('rolls back optimistic remove when unbookmarkRecipe fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetSavedRecipes.mockResolvedValue([mockRecipe])
      mockUnbookmarkRecipe.mockRejectedValue(new Error('Network error'))
      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('is-saved-r1')).toHaveTextContent('true')
      })

      await act(async () => {
        screen.getByText('Toggle R1').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('is-saved-r1')).toHaveTextContent('true')
      })
      consoleError.mockRestore()
    })

    it('does nothing for a recipe without id', async () => {
      const recipeWithoutId: Recipe = { ...mockRecipe, id: undefined }
      const TestNoId = () => {
        const { toggleSave } = useSavedRecipes()
        return <button onClick={() => toggleSave(recipeWithoutId)}>Toggle No-Id</button>
      }

      mockGetSavedRecipes.mockResolvedValue([])
      render(
        <SavedRecipesProvider>
          <TestNoId />
          <TestConsumer />
        </SavedRecipesProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0')
      })

      await act(async () => {
        screen.getByText('Toggle No-Id').click()
      })

      expect(mockBookmarkRecipe).not.toHaveBeenCalled()
      expect(mockUnbookmarkRecipe).not.toHaveBeenCalled()
    })
  })

  describe('reload', () => {
    it('re-fetches saved recipes', async () => {
      mockGetSavedRecipes.mockResolvedValueOnce([]).mockResolvedValueOnce([mockRecipe])
      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0')
      })

      await act(async () => {
        screen.getByText('Reload').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1')
      })

      expect(mockGetSavedRecipes).toHaveBeenCalledTimes(2)
    })

    it('handles API errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetSavedRecipes.mockRejectedValue(new Error('Server error'))
      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('count')).toHaveTextContent('0')
      consoleError.mockRestore()
    })
  })
})

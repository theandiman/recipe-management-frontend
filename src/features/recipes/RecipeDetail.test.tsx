import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { RecipeDetail } from './RecipeDetail'
import * as recipeStorageApi from '../../services/recipeStorageApi'
import { useAuth } from '../../features/auth/AuthContext'
import type { Recipe } from '../../types/nutrition'

// Mock the services
vi.mock('../../services/recipeStorageApi')

// Mock AuthContext
vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock BookmarkButton to avoid AuthContext and SavedRecipesContext dependencies
vi.mock('../../components/BookmarkButton', () => ({
  default: () => null,
  BookmarkButton: () => null,
}))

// Mock LikeButton to avoid LikeContext dependencies
vi.mock('../../components/LikeButton', () => ({
  default: () => null,
  LikeButton: () => null,
}))

// Mock SavedRecipesContext to avoid needing SavedRecipesProvider
vi.mock('../../features/recipes/SavedRecipesContext', () => ({
  useSavedRecipes: () => ({
    savedIds: new Set<string>(),
    savedRecipes: [],
    isSaved: () => false,
    toggleSave: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    reload: vi.fn().mockResolvedValue(undefined)
  }),
  SavedRecipesProvider: ({ children }: { children: unknown }) => children
}))

// Mock CookingMode component
vi.mock('../../components/CookingMode', () => ({
  CookingMode: ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => (
    <div data-testid="cooking-mode">
      <h2>Cooking Mode: {recipe.recipeName}</h2>
      <button onClick={onClose}>Close Cooking Mode</button>
    </div>
  ),
}))

const mockRecipe: Recipe = {
  id: 'recipe-1',
  recipeName: 'Delicious Pasta',
  description: 'A wonderful pasta dish',
  ingredients: ['2 cups pasta', '1 cup tomato sauce', '1 tbsp olive oil'],
  instructions: ['Boil water', 'Cook pasta for 10 minutes', 'Add sauce and mix'],
  prepTimeMinutes: 15,
  cookTimeMinutes: 30,
  servings: 4,
  tags: ['Italian', 'Pasta', 'Dinner'],
  imageUrl: 'https://example.com/pasta.jpg',
  updatedAt: new Date(),
  source: 'user',
}

const mockRecipeWithLegacyTimes: Recipe = {
  ...mockRecipe,
  id: 'recipe-2',
  prepTimeMinutes: undefined,
  cookTimeMinutes: undefined,
  prepTime: '15 minutes',
  cookTime: '30 minutes',
}

const mockRecipeMinimal: Recipe = {
  id: 'recipe-3',
  recipeName: 'Simple Recipe',
  ingredients: ['ingredient 1'],
  instructions: ['step 1'],
  servings: 2,
  updatedAt: new Date(),
  source: 'user',
}

const mockRecipeOwnedByUser: Recipe = {
  ...mockRecipe,
  userId: 'owner-uid',
}

const renderWithRouter = (initialPath = '/dashboard/recipes/recipe-1') => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard/recipes/:id" element={<RecipeDetail />} />
        <Route path="/dashboard/recipes" element={<div>Recipe Library</div>} />
        <Route path="/dashboard/recipes/edit/:id" element={<div>Edit Recipe</div>} />
      </Routes>
    </BrowserRouter>,
    { wrapper: ({ children }) => {
      window.history.pushState({}, '', initialPath)
      return <>{children}</>
    }}
  )
}

describe('RecipeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'owner-uid', email: null, displayName: null, photoURL: null },
    } as any)
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching recipe', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithRouter()

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('border-emerald-600')
    })
  })

  describe('Error States', () => {
    it('should display error message when recipe fetch fails', async () => {
      const error = new Error('Network error')
      vi.mocked(recipeStorageApi.getRecipe).mockRejectedValue(error)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Error loading recipe')).toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should display API error message when available', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Recipe not found in database',
          },
        },
      }
      vi.mocked(recipeStorageApi.getRecipe).mockRejectedValue(apiError)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Error loading recipe')).toBeInTheDocument()
        expect(screen.getByText('Recipe not found in database')).toBeInTheDocument()
      })
    })

    it('should display generic message when recipe is null', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(null as any)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Error loading recipe')).toBeInTheDocument()
        expect(screen.getByText('Recipe not found')).toBeInTheDocument()
      })
    })

    it('should navigate back to library when clicking back button in error state', async () => {
      const error = new Error('Network error')
      vi.mocked(recipeStorageApi.getRecipe).mockRejectedValue(error)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Error loading recipe')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back to library/i })
      await userEvent.click(backButton)

      await waitFor(() => {
        expect(screen.getByText('Recipe Library')).toBeInTheDocument()
      })
    })
  })

  describe('Recipe Display', () => {
    it('should display recipe with all fields', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      // Check description
      expect(screen.getByText('A wonderful pasta dish')).toBeInTheDocument()

      // Check times with minutes
      expect(screen.getByText('15 min')).toBeInTheDocument()
      expect(screen.getByText('30 min')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()

      // Check ingredients
      expect(screen.getByText('2 cups pasta')).toBeInTheDocument()
      expect(screen.getByText('1 cup tomato sauce')).toBeInTheDocument()
      expect(screen.getByText('1 tbsp olive oil')).toBeInTheDocument()

      // Check instructions
      expect(screen.getByText('Boil water')).toBeInTheDocument()
      expect(screen.getByText('Cook pasta for 10 minutes')).toBeInTheDocument()
      expect(screen.getByText('Add sauce and mix')).toBeInTheDocument()

      // Check tags
      expect(screen.getByText('Italian')).toBeInTheDocument()
      expect(screen.getByText('Pasta')).toBeInTheDocument()
      expect(screen.getByText('Dinner')).toBeInTheDocument()

      // Check image
      const image = screen.getByAltText('Delicious Pasta')
      expect(image).toHaveAttribute('src', 'https://example.com/pasta.jpg')
    })

    it('should display recipe with legacy time format', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeWithLegacyTimes)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      // Check legacy time format
      expect(screen.getByText('15 minutes')).toBeInTheDocument()
      expect(screen.getByText('30 minutes')).toBeInTheDocument()
    })

    it('should display minimal recipe without optional fields', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeMinimal)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Simple Recipe')).toBeInTheDocument()
      })

      // Should not show description, times, tags, or image
      expect(screen.queryByText('Prep Time')).not.toBeInTheDocument()
      expect(screen.queryByText('Cook Time')).not.toBeInTheDocument()
      expect(screen.queryByText('Tags')).not.toBeInTheDocument()
      expect(screen.queryByAltText('Simple Recipe')).not.toBeInTheDocument()
      
      // But servings should be displayed since it's always present
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate back to library when clicking back button', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back to library/i })
      await userEvent.click(backButton)

      await waitFor(() => {
        expect(screen.getByText('Recipe Library')).toBeInTheDocument()
      })
    })

    it('should navigate to edit page when clicking edit button', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeOwnedByUser)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /edit recipe/i })
      await userEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
      })
    })
  })

  describe('Cooking Mode', () => {
    it('should open cooking mode when clicking start cooking button', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      const cookingButton = screen.getByRole('button', { name: /start cooking mode/i })
      await userEvent.click(cookingButton)

      await waitFor(() => {
        expect(screen.getByTestId('cooking-mode')).toBeInTheDocument()
        expect(screen.getByText('Cooking Mode: Delicious Pasta')).toBeInTheDocument()
      })
    })

    it('should close cooking mode when close is triggered', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      // Open cooking mode
      const cookingButton = screen.getByRole('button', { name: /start cooking mode/i })
      await userEvent.click(cookingButton)

      await waitFor(() => {
        expect(screen.getByTestId('cooking-mode')).toBeInTheDocument()
      })

      // Close cooking mode
      const closeButton = screen.getByRole('button', { name: /close cooking mode/i })
      await userEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('cooking-mode')).not.toBeInTheDocument()
      })
    })
  })

  describe('Recipe Fetching', () => {
    it('should call getRecipe with correct id from URL params', async () => {
      const getRecipeSpy = vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)

      renderWithRouter('/dashboard/recipes/recipe-123')

      await waitFor(() => {
        expect(getRecipeSpy).toHaveBeenCalledWith('recipe-123')
      })
    })

    it('should handle missing id parameter', async () => {
      const getRecipeSpy = vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)

      renderWithRouter('/dashboard/recipes/')

      // Should not call getRecipe if id is missing
      await waitFor(() => {
        expect(getRecipeSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('Recipe Sharing', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('should toggle sharing from private to public', async () => {
      const privateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }
      const publicRecipe = { ...mockRecipeOwnedByUser, isPublic: true }
      
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(privateRecipe)
      vi.mocked(recipeStorageApi.updateRecipeSharing).mockResolvedValue(publicRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      // Initially should show "Share" button
      const shareButton = screen.getByRole('button', { name: /share/i })
      expect(shareButton).toHaveAttribute('title', 'Share recipe publicly')

      // Click to share
      await userEvent.click(shareButton)

      await waitFor(() => {
        expect(recipeStorageApi.updateRecipeSharing).toHaveBeenCalledWith('recipe-1', true)
      })

      // Button should now show "Make Private"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /make private/i })).toBeInTheDocument()
      })
    })

    it('should toggle sharing from public to private', async () => {
      const publicRecipe = { ...mockRecipeOwnedByUser, isPublic: true }
      const privateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }
      
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(publicRecipe)
      vi.mocked(recipeStorageApi.updateRecipeSharing).mockResolvedValue(privateRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      // Initially should show "Make Private" button
      const makePrivateButton = screen.getByRole('button', { name: /make private/i })
      expect(makePrivateButton).toHaveAttribute('title', 'Make recipe private')

      // Click to make private
      await userEvent.click(makePrivateButton)

      await waitFor(() => {
        expect(recipeStorageApi.updateRecipeSharing).toHaveBeenCalledWith('recipe-1', false)
      })

      // Button should now show "Share"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
      })
    })

    it('should handle API errors during sharing toggle', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const privateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }
      
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(privateRecipe)
      vi.mocked(recipeStorageApi.updateRecipeSharing).mockRejectedValue(new Error('Network error'))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      const shareButton = screen.getByRole('button', { name: /share/i })
      await userEvent.click(shareButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to update recipe sharing:',
          expect.any(Error)
        )
      })

      // Error message should be shown to the user
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Could not update sharing status. Please try again.')).toBeInTheDocument()
      })

      // Button should still show "Share" (state not updated due to error)
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })

    it('should dismiss the sharing error when close button is clicked', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const privateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }

      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(privateRecipe)
      vi.mocked(recipeStorageApi.updateRecipeSharing).mockRejectedValue(new Error('Network error'))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /share/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Click the dismiss button
      await userEvent.click(screen.getByRole('button', { name: /dismiss error/i }))

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('should auto-dismiss the sharing error after 5 seconds', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      try {
        const privateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }

        vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(privateRecipe)
        vi.mocked(recipeStorageApi.updateRecipeSharing).mockRejectedValue(new Error('Network error'))

        renderWithRouter()

        await waitFor(() => {
          expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
        })

        await userEvent.click(screen.getByRole('button', { name: /share/i }))

        // Advance time by 5 seconds to trigger auto-dismiss
        await vi.advanceTimersByTimeAsync(5000)

        await waitFor(() => {
          expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        })
      } finally {
        consoleErrorSpy.mockRestore()
        vi.useRealTimers()
      }
    })

    it('should clear the sharing error when a subsequent toggle succeeds', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const privateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }
      const publicRecipe = { ...mockRecipeOwnedByUser, isPublic: true }

      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(privateRecipe)
      // First call fails, second call succeeds
      vi.mocked(recipeStorageApi.updateRecipeSharing)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(publicRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      // First click → error banner appears
      await userEvent.click(screen.getByRole('button', { name: /share/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Second click → success; banner should be gone immediately
      await userEvent.click(screen.getByRole('button', { name: /share/i }))

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /make private/i })).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('should disable sharing button during API call', async () => {
      const privateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }
      const publicRecipe = { ...mockRecipeOwnedByUser, isPublic: true }
      
      let resolveUpdate: ((value: Recipe) => void) | undefined
      const updatePromise = new Promise<Recipe>((resolve) => {
        resolveUpdate = resolve
      })
      
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(privateRecipe)
      vi.mocked(recipeStorageApi.updateRecipeSharing).mockReturnValue(updatePromise)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      const shareButton = screen.getByRole('button', { name: /share/i })
      expect(shareButton).not.toBeDisabled()

      // Click to initiate sharing
      await userEvent.click(shareButton)

      // Button should be disabled during API call
      await waitFor(() => {
        expect(shareButton).toBeDisabled()
      })

      // Should show loading spinner
      const spinner = shareButton.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()

      // Resolve the API call
      if (resolveUpdate) {
        resolveUpdate(publicRecipe)
      }

      // Button should be enabled again
      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /make private/i })
        expect(updatedButton).not.toBeDisabled()
      })
    })
  })

  describe('Copy Link', () => {
    let originalClipboardDescriptor: PropertyDescriptor | undefined

    beforeEach(() => {
      originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    })

    afterEach(() => {
      vi.useRealTimers()
      if (originalClipboardDescriptor !== undefined) {
        Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor)
      } else {
        Object.defineProperty(navigator, 'clipboard', {
          value: undefined,
          configurable: true,
          writable: true,
        })
      }
    })

    it('should render Copy Link button when recipe is public', async () => {
      const publicRecipe = { ...mockRecipe, isPublic: true }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(publicRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    })

    it('should not render Copy Link button when recipe is private', async () => {
      const privateRecipe = { ...mockRecipe, isPublic: false }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(privateRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument()
    })

    it('should not render Copy Link button when isPublic is undefined', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument()
    })

    it('should call clipboard.writeText with the correct URL when clicked', async () => {
      const publicRecipe = { ...mockRecipe, isPublic: true }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(publicRecipe)

      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy link/i })
      await userEvent.click(copyButton)

      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('/dashboard/recipes/recipe-1')
      )
    })

    it('should show "Copied!" feedback for ~2 seconds after click', async () => {
      const publicRecipe = { ...mockRecipe, isPublic: true }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(publicRecipe)

      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      vi.useFakeTimers()

      // Use fireEvent (synchronous) — userEvent.click hangs with fake timers
      // because it awaits handler settlement and writeText is a microtask,
      // not a timer, so advanceTimers never resolves it.
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }))

      // Flush writeText Promise + React state update.
      // React 18's scheduler uses queueMicrotask/Promise, not setTimeout,
      // so act works correctly even when fake timers are active.
      await act(async () => {})

      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()

      // Fire the 2-second reset timer and flush the resulting state update
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    })

    it('should show fallback notification when navigator.clipboard is unavailable', async () => {
      const publicRecipe = { ...mockRecipe, isPublic: true }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(publicRecipe)

      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy link/i })
      await userEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/copy this link manually/i)).toBeInTheDocument()
        expect(screen.getByText(/\/dashboard\/recipes\/recipe-1/)).toBeInTheDocument()
      })
    })

    it('should show fallback notification when clipboard.writeText rejects', async () => {
      const publicRecipe = { ...mockRecipe, isPublic: true }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(publicRecipe)

      const writeTextMock = vi.fn().mockRejectedValue(new Error('Not allowed'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy link/i })
      await userEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/copy this link manually/i)).toBeInTheDocument()
      })
    })

    it('should dismiss the fallback notification when Dismiss button is clicked', async () => {
      const publicRecipe = { ...mockRecipe, isPublic: true }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(publicRecipe)

      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /copy link/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('AI metadata display', () => {
    const mockRecipeWithNutritionAndTips: Recipe = {
      ...mockRecipe,
      nutritionalInfo: {
        perServing: {
          calories: 350,
          protein: 20,
          carbohydrates: 45,
          fat: 8,
          fiber: 3,
          sodium: 200,
        },
      },
      tips: {
        storage: 'Store in fridge',
        makeAhead: 'Can be made 1 day ahead',
        substitutions: ['Use oat milk instead of dairy'],
        variations: ['Add chili for heat'],
        reheating: 'Microwave 2 min',
      },
    }

    it('renders NutritionFacts section when nutritionalInfo.perServing is present', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeWithNutritionAndTips)
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('Nutrition Facts')).toBeInTheDocument()
      })
    })

    it('does not render NutritionFacts section when nutritionalInfo is absent', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })
      expect(screen.queryByText('Nutrition Facts')).not.toBeInTheDocument()
    })

    it('renders tips section with storage and makeAhead when tips are present', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeWithNutritionAndTips)
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('Tips & Tricks')).toBeInTheDocument()
      })
      expect(screen.getByText('Store in fridge')).toBeInTheDocument()
      expect(screen.getByText('Can be made 1 day ahead')).toBeInTheDocument()
      expect(screen.getByText('Microwave 2 min')).toBeInTheDocument()
    })

    it('renders tips substitutions and variations', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeWithNutritionAndTips)
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('Ingredient Substitutions')).toBeInTheDocument()
      })
      expect(screen.getByText('Use oat milk instead of dairy')).toBeInTheDocument()
      expect(screen.getByText('Recipe Variations')).toBeInTheDocument()
      expect(screen.getByText('Add chili for heat')).toBeInTheDocument()
    })

    it('does not render tips section when recipe.tips is absent', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })
      expect(screen.queryByText('Tips & Tricks')).not.toBeInTheDocument()
    })
  })

  describe('dietary restrictions', () => {
    const mockRecipeWithDietaryRestrictions: Recipe = {
      ...mockRecipe,
      dietaryRestrictions: ['vegan', 'gluten-free'],
    }

    it('renders dietary restriction chips when recipe.dietaryRestrictions is present', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeWithDietaryRestrictions)
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.getByText('Dietary')).toBeInTheDocument()
      expect(screen.getByText('vegan')).toBeInTheDocument()
      expect(screen.getByText('gluten-free')).toBeInTheDocument()
    })

    it('does not render dietary restrictions section when absent', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.queryByText('Dietary')).not.toBeInTheDocument()
    })

    it('does not render dietary restrictions section when array is empty', async () => {
      const mockRecipeEmptyDietary: Recipe = { ...mockRecipe, dietaryRestrictions: [] }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeEmptyDietary)
      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.queryByText('Dietary')).not.toBeInTheDocument()
    })
  })

  describe('Ownership Controls', () => {
    it('should show Edit Recipe button when current user owns the recipe', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeOwnedByUser)
      vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'owner-uid', email: null, displayName: null, photoURL: null },
      } as any)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit recipe/i })).toBeInTheDocument()
      })
    })

    it('should hide Edit Recipe button when current user does not own the recipe', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeOwnedByUser)
      vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'other-user', email: null, displayName: null, photoURL: null },
      } as any)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /edit recipe/i })).not.toBeInTheDocument()
    })

    it('should hide Edit Recipe button when user is not authenticated', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipeOwnedByUser)
      vi.mocked(useAuth).mockReturnValue({ user: null } as any)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /edit recipe/i })).not.toBeInTheDocument()
    })

    it('should show Share button when current user owns the recipe', async () => {
      const ownedPrivateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(ownedPrivateRecipe)
      vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'owner-uid', email: null, displayName: null, photoURL: null },
      } as any)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
      })
    })

    it('should hide Share button when current user does not own the recipe', async () => {
      const ownedPrivateRecipe = { ...mockRecipeOwnedByUser, isPublic: false }
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(ownedPrivateRecipe)
      vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'other-user', email: null, displayName: null, photoURL: null },
      } as any)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
    })
  })
})

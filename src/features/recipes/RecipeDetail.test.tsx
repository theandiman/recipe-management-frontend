import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { RecipeDetail } from './RecipeDetail'
import * as recipeStorageApi from '../../services/recipeStorageApi'
import type { Recipe } from '../../types/nutrition'

// Mock the services
vi.mock('../../services/recipeStorageApi')

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
      vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe)

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
    it('should toggle sharing from private to public', async () => {
      const privateRecipe = { ...mockRecipe, isPublic: false }
      const publicRecipe = { ...mockRecipe, isPublic: true }
      
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
      const publicRecipe = { ...mockRecipe, isPublic: true }
      const privateRecipe = { ...mockRecipe, isPublic: false }
      
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
      const privateRecipe = { ...mockRecipe, isPublic: false }
      
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

      // Button should still show "Share" (state not updated due to error)
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })

    it('should disable sharing button during API call', async () => {
      const privateRecipe = { ...mockRecipe, isPublic: false }
      const publicRecipe = { ...mockRecipe, isPublic: true }
      
      let resolveUpdate: (value: Recipe) => void
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
      resolveUpdate!(publicRecipe)

      // Button should be enabled again
      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /make private/i })
        expect(updatedButton).not.toBeDisabled()
      })
    })
  })
})

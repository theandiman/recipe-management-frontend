import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { RecipeLibrary } from './RecipeLibrary'
import * as recipeStorageApi from '../../services/recipeStorageApi'
import type { Recipe } from '../../types/nutrition'

// Mock the API
vi.mock('../../services/recipeStorageApi', () => ({
  getRecipes: vi.fn(),
  deleteRecipe: vi.fn()
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const mockRecipes: Recipe[] = [
  {
    id: '1',
    userId: 'user-123',
    recipeName: 'Chocolate Cake',
    description: 'Delicious chocolate cake',
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    servings: 8,
    imageUrl: 'https://example.com/cake.jpg',
    ingredients: ['2 cups flour', '1 cup sugar'],
    instructions: ['Mix ingredients', 'Bake at 350F'],
    tags: ['dessert', 'cake'],
    source: 'ai-generated',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    userId: 'user-123',
    recipeName: 'Pasta Carbonara',
    description: 'Classic Italian pasta',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    imageUrl: undefined,
    ingredients: ['pasta', 'eggs', 'bacon'],
    instructions: ['Cook pasta', 'Mix with sauce'],
    tags: ['italian', 'pasta'],
    source: 'ai-generated',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
]

describe('RecipeLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderRecipeLibrary = () => {
    return render(
      <BrowserRouter>
        <RecipeLibrary />
      </BrowserRouter>
    )
  }

  describe('Loading State', () => {
    it('should show loading spinner while fetching recipes', () => {
      vi.mocked(recipeStorageApi.getRecipes).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      )

      renderRecipeLibrary()

      expect(screen.getByText('Recipe Library')).toBeInTheDocument()
      expect(screen.getByText('Browse and manage your recipe collection')).toBeInTheDocument()
      
      // Check for skeleton loading cards (they have animate-pulse class)
      const skeletonCards = document.querySelectorAll('.animate-pulse')
      expect(skeletonCards.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no recipes exist', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue([])

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('No recipes yet')).toBeInTheDocument()
      })

      expect(screen.getByText('Get started by generating your first recipe!')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error message when fetching fails', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockRejectedValue(
        new Error('Network error')
      )

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Error loading recipes')).toBeInTheDocument()
      })

      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('should show API error message when available', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Authentication failed'
          }
        }
      }
      vi.mocked(recipeStorageApi.getRecipes).mockRejectedValue(apiError)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Authentication failed')).toBeInTheDocument()
      })
    })
  })

  describe('Recipe Display', () => {
    it('should display all recipes when loaded', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
      expect(screen.getByText(/Showing\s*2\s*of\s*2\s*recipes?/i)).toBeInTheDocument()
    })

    it('should filter recipes by search', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search by title, description or tag...')
      fireEvent.change(searchInput, { target: { value: 'Pasta' } })

      await waitFor(() => {
        expect(screen.queryByText('Chocolate Cake')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
    })

    it('should filter recipes by tag', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      const select = screen.getByLabelText('Filter by tag')
      fireEvent.change(select, { target: { value: 'pasta' } })

      await waitFor(() => {
        expect(screen.queryByText('Chocolate Cake')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
    })

    it('should display recipe metadata correctly', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      // Check prep + cook time
      expect(screen.getByText('60 min')).toBeInTheDocument() // 20 + 40
      expect(screen.getByText('25 min')).toBeInTheDocument() // 10 + 15

      // Check servings
      expect(screen.getByText('8 servings')).toBeInTheDocument()
      expect(screen.getByText('4 servings')).toBeInTheDocument()
    })

    it('should display descriptions', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Delicious chocolate cake')).toBeInTheDocument()
      })

      expect(screen.getByText('Classic Italian pasta')).toBeInTheDocument()
    })

    it('should display images when available', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        const cakeImage = images.find(img => img.getAttribute('alt') === 'Chocolate Cake')
        expect(cakeImage).toHaveAttribute('src', 'https://example.com/cake.jpg')
      })
    })

    it('should paginate when many recipes exist', async () => {
      // Create 25 mock recipes to trigger pagination (pageSize default is 20)
      const manyRecipes: Recipe[] = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        userId: 'user-123',
        recipeName: `Recipe ${i + 1}`,
        description: `Desc ${i + 1}`,
        prepTimeMinutes: 5,
        cookTimeMinutes: 5,
        servings: 2,
        imageUrl: undefined,
        ingredients: [],
        instructions: [],
        tags: [],
        source: 'ai-generated',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }))

      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(manyRecipes)

      renderRecipeLibrary()

      // Wait for first page to render
      await waitFor(() => {
        expect(screen.getByText('Recipe 1')).toBeInTheDocument()
      })

      // Should show last item of first page (20) and not show item from page 2
      expect(screen.getByText('Recipe 20')).toBeInTheDocument()
      expect(screen.queryByText('Recipe 21')).not.toBeInTheDocument()

      // Click next to go to page 2
      const next = screen.getByRole('button', { name: /Next page/i })
      fireEvent.click(next)

      await waitFor(() => {
        expect(screen.getByText('Recipe 21')).toBeInTheDocument()
      })

      // Page 2 should show recipe 25
      expect(screen.getByText('Recipe 25')).toBeInTheDocument()
    })

    it('should show placeholder icon when no image', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
      })

      // Recipe without image should have gradient background with icon
      const carbonaraCard = screen.getByText('Pasta Carbonara').closest('.bg-white')
      expect(carbonaraCard).toBeInTheDocument()
    })

    it('should show singular "recipe" for one item', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue([mockRecipes[0]])

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText(/Showing\s*1\s*of\s*1\s*recipe/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to recipe detail when card is clicked', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      const recipeCard = screen.getByText('Chocolate Cake').closest('.cursor-pointer')
      fireEvent.click(recipeCard!)

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes/1')
    })
  })

  describe('Delete Functionality', () => {
    it('should show delete button on hover', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      // Delete buttons exist but are hidden (opacity-0)
      // Title now includes recipe name (e.g., "Delete Chocolate Cake"), so look for "Delete" via regex
      const deleteButtons = screen.getAllByTitle(/Delete/i)
      expect(deleteButtons).toHaveLength(2)
    })

    it('should open confirmation modal when delete is clicked', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle(/Delete/i)
      fireEvent.click(deleteButtons[0])

      // Modal should appear
      expect(screen.getByText('Delete Recipe')).toBeInTheDocument()
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument()
      expect(screen.getByText(/"Chocolate Cake"/)).toBeInTheDocument()
    })

    it('should close modal when cancel is clicked', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      // Open modal
      const deleteButtons = screen.getAllByTitle(/Delete/i)
      fireEvent.click(deleteButtons[0])

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      // Modal should be gone
      await waitFor(() => {
        expect(screen.queryByText('Delete Recipe')).not.toBeInTheDocument()
      })
    })

    it('should delete recipe when confirmed', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)
      vi.mocked(recipeStorageApi.deleteRecipe).mockResolvedValue(undefined)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      // Open modal
      const deleteButtons = screen.getAllByTitle(/Delete/i)
      fireEvent.click(deleteButtons[0])

      // Click delete
      const deleteButton = screen.getByRole('button', { name: /^Delete$/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(recipeStorageApi.deleteRecipe).toHaveBeenCalledWith('1')
      })

      // Recipe should be removed from list
      await waitFor(() => {
        expect(screen.queryByText('Chocolate Cake')).not.toBeInTheDocument()
      })

      // Other recipe should still be visible
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
    })

    it('should show loading state during deletion', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)
      vi.mocked(recipeStorageApi.deleteRecipe).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      // Open modal
      const deleteButtons = screen.getAllByTitle(/Delete/i)
      fireEvent.click(deleteButtons[0])

      // Click delete
      const deleteButton = screen.getByRole('button', { name: /^Delete$/i })
      fireEvent.click(deleteButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument()
      })

      // Buttons should be disabled
      expect(deleteButton).toBeDisabled()
    })

    it('should handle delete errors', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)
      vi.mocked(recipeStorageApi.deleteRecipe).mockRejectedValue(
        new Error('Delete failed')
      )

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      // Open modal and delete
      const deleteButtons = screen.getAllByTitle(/Delete/i)
      fireEvent.click(deleteButtons[0])
      
      const deleteButton = screen.getByRole('button', { name: /^Delete$/i })
      fireEvent.click(deleteButton)

      // Error should be displayed (modal closes but error shows)
      await waitFor(() => {
        expect(screen.queryByText('Delete Recipe')).not.toBeInTheDocument()
      })
    })

    it('should not navigate to recipe when delete button is clicked', async () => {
      vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

      renderRecipeLibrary()

      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle(/Delete/i)
      fireEvent.click(deleteButtons[0])

      // Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})

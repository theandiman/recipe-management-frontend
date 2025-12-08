import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecipeSharingToggle } from './RecipeSharingToggle'
import * as recipeStorageApi from '../services/recipeStorageApi'

// Mock the recipeStorageApi module
vi.mock('../services/recipeStorageApi', () => ({
  updateRecipeSharing: vi.fn()
}))

describe('RecipeSharingToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the toggle button with initial public state', () => {
      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={true}
        />
      )

      const button = screen.getByLabelText('Make recipe private')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('title', 'Unshare recipe (make private)')
    })

    it('should render the toggle button with initial private state', () => {
      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('title', 'Share recipe with community')
    })

    it('should display different icons for public and private states', () => {
      const { rerender } = render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={true}
        />
      )

      // Public state should have filled icon (currentColor fill)
      let button = screen.getByLabelText('Make recipe private')
      let svg = button.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')

      // Re-render with private state
      rerender(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      // Private state should have outline icon (stroke, no fill)
      button = screen.getByLabelText('Make recipe public')
      svg = button.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
    })
  })

  describe('Toggle behavior', () => {
    it('should call updateRecipeSharing when toggled from private to public', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockResolvedValue({} as any)

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockUpdateRecipeSharing).toHaveBeenCalledWith('recipe-123', true)
      })
    })

    it('should call updateRecipeSharing when toggled from public to private', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockResolvedValue({} as any)

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={true}
        />
      )

      const button = screen.getByLabelText('Make recipe private')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockUpdateRecipeSharing).toHaveBeenCalledWith('recipe-123', false)
      })
    })

    it('should update the button state after successful toggle', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockResolvedValue({} as any)

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByLabelText('Make recipe private')).toBeInTheDocument()
      })
    })

    it('should call onToggle callback when provided and toggle succeeds', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockResolvedValue({} as any)
      const mockOnToggle = vi.fn()

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith(true)
      })
    })

    it('should not call onToggle callback when toggle fails', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockRejectedValue(new Error('Network error'))
      const mockOnToggle = vi.fn()

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
          onToggle={mockOnToggle}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to update sharing status')).toBeInTheDocument()
      })

      expect(mockOnToggle).not.toHaveBeenCalled()
    })
  })

  describe('Loading state', () => {
    it('should disable button during API call', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      let resolvePromise: (value: any) => void
      mockUpdateRecipeSharing.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      // Button should be disabled during loading
      await waitFor(() => {
        expect(button).toBeDisabled()
      })

      // Resolve the promise
      resolvePromise!({} as any)

      // Button should be enabled again after API call completes
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })

    it('should have loading opacity class when disabled', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      let resolvePromise: (value: any) => void
      mockUpdateRecipeSharing.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(button.className).toContain('disabled:opacity-50')
        expect(button.className).toContain('disabled:cursor-not-allowed')
      })

      resolvePromise!({} as any)
    })
  })

  describe('Error handling', () => {
    it('should display error message when API call fails', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockRejectedValue(new Error('Network error'))

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to update sharing status')).toBeInTheDocument()
      })
    })

    it('should display custom error message from API response', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockRejectedValue({
        response: {
          data: {
            message: 'Recipe not found'
          }
        }
      })

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Recipe not found')).toBeInTheDocument()
      })
    })

    it('should not change toggle state when API call fails', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockRejectedValue(new Error('Network error'))

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to update sharing status')).toBeInTheDocument()
      })

      // State should remain private (false)
      expect(screen.getByLabelText('Make recipe public')).toBeInTheDocument()
    })

    it('should clear previous error when toggling again', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      
      // First call fails
      mockUpdateRecipeSharing.mockRejectedValueOnce(new Error('Network error'))
      
      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      // Second call succeeds
      mockUpdateRecipeSharing.mockResolvedValueOnce({} as any)
      fireEvent.click(screen.getByLabelText('Make recipe public'))

      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for public state', () => {
      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={true}
        />
      )

      const button = screen.getByLabelText('Make recipe private')
      expect(button).toHaveAttribute('aria-label', 'Make recipe private')
    })

    it('should have proper aria-label for private state', () => {
      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      expect(button).toHaveAttribute('aria-label', 'Make recipe public')
    })

    it('should have descriptive title attribute for public state', () => {
      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={true}
        />
      )

      const button = screen.getByLabelText('Make recipe private')
      expect(button).toHaveAttribute('title', 'Unshare recipe (make private)')
    })

    it('should have descriptive title attribute for private state', () => {
      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      expect(button).toHaveAttribute('title', 'Share recipe with community')
    })

    it('should have focus ring styles', () => {
      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      expect(button.className).toContain('focus:outline-none')
      expect(button.className).toContain('focus:ring-2')
      expect(button.className).toContain('focus:ring-emerald-500')
    })
  })

  describe('Edge cases', () => {
    it('should work without onToggle callback', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockResolvedValue({} as any)

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      
      // Should not throw when clicking without onToggle callback
      expect(() => fireEvent.click(button)).not.toThrow()

      await waitFor(() => {
        expect(mockUpdateRecipeSharing).toHaveBeenCalled()
      })
    })

    it('should handle rapid consecutive clicks gracefully', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockResolvedValue({} as any)

      render(
        <RecipeSharingToggle
          recipeId="recipe-123"
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      
      // Click multiple times rapidly
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      // Only the first click should trigger the API call (button becomes disabled)
      await waitFor(() => {
        expect(mockUpdateRecipeSharing).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle empty recipe ID', async () => {
      const mockUpdateRecipeSharing = vi.mocked(recipeStorageApi.updateRecipeSharing)
      mockUpdateRecipeSharing.mockResolvedValue({} as any)

      render(
        <RecipeSharingToggle
          recipeId=""
          initialIsPublic={false}
        />
      )

      const button = screen.getByLabelText('Make recipe public')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockUpdateRecipeSharing).toHaveBeenCalledWith('', true)
      })
    })
  })
})

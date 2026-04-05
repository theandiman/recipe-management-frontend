import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CommunityPage } from './CommunityPage'
import * as recipeStorageApi from '../../services/recipeStorageApi'
import type { Recipe } from '../../types/nutrition'

// Mock the API module
vi.mock('../../services/recipeStorageApi', () => ({
  getPublicRecipes: vi.fn(),
  getFeed: vi.fn(),
}))

// Mock BookmarkButton to avoid AuthContext and SavedRecipesContext dependencies
vi.mock('../../components/BookmarkButton', () => ({
  default: () => null,
  BookmarkButton: () => null,
}))

// Mock useAuth - default to unauthenticated
const mockUseAuth = vi.fn()
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockRecipes = [
  { id: '1', recipeName: 'Spaghetti Carbonara', description: 'Classic Italian pasta dish', servings: 4 },
  { id: '2', recipeName: 'Chicken Tikka Masala', description: 'Creamy Indian curry', servings: 6 },
] as unknown as Recipe[]

const mockFeedRecipes = [
  { id: '3', recipeName: 'Avocado Toast', description: 'Simple breakfast', servings: 1 },
] as unknown as Recipe[]

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/community']) =>
  render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>)

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: unauthenticated
    mockUseAuth.mockReturnValue({ user: null })
  })

  it('shows loading skeleton while fetching', () => {
    vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockImplementation(
      () => new Promise(() => {}) // never resolves
    )
    renderWithRouter(<CommunityPage />)
    expect(screen.getByText('Community Recipes')).toBeInTheDocument()
    expect(screen.getByText('Discover recipes shared by the community')).toBeInTheDocument()
    // Skeleton cards should be present (they contain animate-pulse divs)
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
  })

  it('renders recipe cards when recipes are loaded', async () => {
    vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
    renderWithRouter(<CommunityPage />)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    })
    expect(screen.getByText('Chicken Tikka Masala')).toBeInTheDocument()
  })

  it('shows empty state when there are no public recipes', async () => {
    vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
    renderWithRouter(<CommunityPage />)

    await waitFor(() => {
      expect(screen.getByText('No community recipes yet')).toBeInTheDocument()
    })
    expect(screen.getByText('Be the first to share a recipe with the community!')).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockRejectedValue(
      new Error('Network error')
    )
    renderWithRouter(<CommunityPage />)

    await waitFor(() => {
      expect(screen.getByText('Error loading community recipes')).toBeInTheDocument()
    })
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('filters recipes by name when search text is entered', async () => {
    const user = userEvent.setup()
    vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
    renderWithRouter(<CommunityPage />)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search by recipe name...')
    await user.type(searchInput, 'spaghetti')

    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    expect(screen.queryByText('Chicken Tikka Masala')).not.toBeInTheDocument()
  })

  it('shows "no recipes match" message when search yields no results', async () => {
    const user = userEvent.setup()
    vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
    renderWithRouter(<CommunityPage />)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search by recipe name...')
    await user.type(searchInput, 'zzznomatch')

    expect(screen.getByText('No recipes match your search.')).toBeInTheDocument()
  })

  it('calls getPublicRecipes without an auth token', async () => {
    const spy = vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
    renderWithRouter(<CommunityPage />)

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1)
    })
    // Verify it was called with no arguments (no auth token parameter)
    expect(spy).toHaveBeenCalledWith()
  })

  describe('tab bar', () => {
    it('does not show tab bar for unauthenticated users', async () => {
      mockUseAuth.mockReturnValue({ user: null })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Community' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Following' })).not.toBeInTheDocument()
      })
    })

    it('shows tab bar for authenticated users', async () => {
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Community' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
      })
    })

    it('defaults to Community tab', async () => {
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
      vi.spyOn(recipeStorageApi, 'getFeed').mockResolvedValue([])
      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      expect(recipeStorageApi.getPublicRecipes).toHaveBeenCalledTimes(1)
      expect(recipeStorageApi.getFeed).not.toHaveBeenCalled()
    })

    it('switches to Following tab and calls getFeed', async () => {
      const user = userEvent.setup()
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
      vi.spyOn(recipeStorageApi, 'getFeed').mockResolvedValue(mockFeedRecipes)
      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Following' }))

      await waitFor(() => {
        expect(screen.getByText('Avocado Toast')).toBeInTheDocument()
      })
      expect(recipeStorageApi.getFeed).toHaveBeenCalledTimes(1)
    })

    it('shows empty state with CTA when following feed is empty', async () => {
      const user = userEvent.setup()
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
      vi.spyOn(recipeStorageApi, 'getFeed').mockResolvedValue([])
      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Following' }))

      await waitFor(() => {
        expect(screen.getByText('Follow some cooks to see their recipes here')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: 'Browse Community' })).toBeInTheDocument()
    })

    it('Browse Community CTA switches back to Community tab', async () => {
      const user = userEvent.setup()
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
      vi.spyOn(recipeStorageApi, 'getFeed').mockResolvedValue([])
      renderWithRouter(<CommunityPage />)

      // Switch to Following tab
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: 'Following' }))

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Browse Community' })).toBeInTheDocument()
      })

      // Click Browse Community
      await user.click(screen.getByRole('button', { name: 'Browse Community' }))

      // Should now show community recipes
      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
    })

    it('activates Following tab when URL has ?tab=following', async () => {
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
      vi.spyOn(recipeStorageApi, 'getFeed').mockResolvedValue(mockFeedRecipes)
      renderWithRouter(<CommunityPage />, ['/community?tab=following'])

      await waitFor(() => {
        expect(screen.getByText('Avocado Toast')).toBeInTheDocument()
      })
      expect(recipeStorageApi.getFeed).toHaveBeenCalledTimes(1)
      expect(recipeStorageApi.getPublicRecipes).not.toHaveBeenCalled()
    })

    it('ignores ?tab=following for unauthenticated users and loads community', async () => {
      mockUseAuth.mockReturnValue({ user: null })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
      vi.spyOn(recipeStorageApi, 'getFeed').mockResolvedValue([])
      renderWithRouter(<CommunityPage />, ['/community?tab=following'])

      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      expect(recipeStorageApi.getPublicRecipes).toHaveBeenCalledTimes(1)
      expect(recipeStorageApi.getFeed).not.toHaveBeenCalled()
    })
  })
})

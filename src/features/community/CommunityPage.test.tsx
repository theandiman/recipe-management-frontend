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

// Mock LikeButton to avoid LikeContext dependencies
vi.mock('../../components/LikeButton', () => ({
  default: () => null,
  LikeButton: () => null,
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

import { OmniSearchProvider, useOmniSearch } from '../../components/search/OmniSearchContext'

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/community']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <OmniSearchProvider>{ui}</OmniSearchProvider>
    </MemoryRouter>
  )

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
    expect(screen.getByText('Discover recipes shared by home cooks and community chefs.')).toBeInTheDocument()
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

  it('filters recipes by name when search text is entered via search bar', async () => {
    const user = userEvent.setup()
    vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)

    const SearchWrapper = () => {
      const { searchQuery, setSearchQuery } = useOmniSearch()
      return (
        <div>
          <input
            placeholder="Search recipes, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <CommunityPage />
        </div>
      )
    }

    renderWithRouter(<SearchWrapper />)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search recipes, tags...')
    await user.type(searchInput, 'spaghetti')

    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    expect(screen.queryByText('Chicken Tikka Masala')).not.toBeInTheDocument()
  })

  it('shows "no recipes match" message when search yields no results', async () => {
    const user = userEvent.setup()
    vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)

    const SearchWrapper = () => {
      const { searchQuery, setSearchQuery } = useOmniSearch()
      return (
        <div>
          <input
            placeholder="Search recipes, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <CommunityPage />
        </div>
      )
    }

    renderWithRouter(<SearchWrapper />)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search recipes, tags...')
    await user.type(searchInput, 'zzznomatch')

    expect(screen.getByText(/No community recipes found/i)).toBeInTheDocument()
  })

  it('calls getPublicRecipes without an auth token', async () => {
    const spy = vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
    renderWithRouter(<CommunityPage />)

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1)
    })
    expect(spy).toHaveBeenCalledWith()
  })

  describe('following quick filter', () => {
    it('does not show Cooks You Follow button for unauthenticated users', async () => {
      mockUseAuth.mockReturnValue({ user: null })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /Cooks You Follow/i })).not.toBeInTheDocument()
    })

    it('shows Cooks You Follow button for authenticated users', async () => {
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cooks You Follow/i })).toBeInTheDocument()
      })
    })

    it('toggles Cooks You Follow filter and calls getFeed', async () => {
      const user = userEvent.setup()
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(mockRecipes)
      vi.spyOn(recipeStorageApi, 'getFeed').mockResolvedValue(mockFeedRecipes)
      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cooks You Follow/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Cooks You Follow/i }))

      await waitFor(() => {
        expect(screen.getByText('Avocado Toast')).toBeInTheDocument()
      })
      expect(recipeStorageApi.getFeed).toHaveBeenCalledTimes(1)
    })

    it('activates Cooks You Follow filter when URL has ?following=true', async () => {
      mockUseAuth.mockReturnValue({ user: { uid: 'u1', email: 'user@example.com' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue([])
      vi.spyOn(recipeStorageApi, 'getFeed').mockResolvedValue(mockFeedRecipes)
      renderWithRouter(<CommunityPage />, ['/community?following=true'])

      await waitFor(() => {
        expect(screen.getByText('Avocado Toast')).toBeInTheDocument()
      })
      expect(recipeStorageApi.getFeed).toHaveBeenCalledTimes(1)
      expect(recipeStorageApi.getPublicRecipes).not.toHaveBeenCalled()
    })
  })

  describe('sort', () => {
    const recipesWithLikes = [
      { id: '1', recipeName: 'Spaghetti Carbonara', description: 'Classic', servings: 4, likeCount: 3 },
      { id: '2', recipeName: 'Chicken Tikka Masala', description: 'Curry', servings: 6, likeCount: 10 },
      { id: '3', recipeName: 'Caesar Salad', description: 'Salad', servings: 2, likeCount: 1 },
    ] as unknown as Recipe[]

    it('shows sort select when recipes are loaded', async () => {
      mockUseAuth.mockReturnValue({ user: { uid: 'u1' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(recipesWithLikes)

      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/Sort by/i)).toBeInTheDocument()
      })
    })

    it('sorts recipes by most liked when selected', async () => {
      const user = userEvent.setup()
      mockUseAuth.mockReturnValue({ user: { uid: 'u1' } })
      vi.spyOn(recipeStorageApi, 'getPublicRecipes').mockResolvedValue(recipesWithLikes)

      renderWithRouter(<CommunityPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/Sort by/i)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText(/Sort by/i), 'most-liked')

      const cards = screen.getAllByRole('heading', { level: 3 })
      expect(cards[0]).toHaveTextContent('Chicken Tikka Masala')
      expect(cards[1]).toHaveTextContent('Spaghetti Carbonara')
      expect(cards[2]).toHaveTextContent('Caesar Salad')
    })
  })
})

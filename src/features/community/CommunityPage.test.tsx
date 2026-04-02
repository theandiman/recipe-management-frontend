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
}))

const mockRecipes: Recipe[] = [
  {
    id: '1',
    userId: 'user-1',
    recipeName: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 4,
    ingredients: ['pasta', 'eggs', 'pancetta'],
    instructions: ['Cook pasta', 'Mix with eggs'],
    tags: ['italian', 'pasta'],
    source: 'ai-generated',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user-2',
    recipeName: 'Chicken Tikka Masala',
    description: 'Creamy Indian curry',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 6,
    ingredients: ['chicken', 'tomatoes', 'cream'],
    instructions: ['Marinate chicken', 'Cook curry'],
    tags: ['indian', 'curry'],
    source: 'ai-generated',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
]

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})

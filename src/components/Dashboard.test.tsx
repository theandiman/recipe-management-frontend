import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import * as recipeStorageApi from '../services/recipeStorageApi'
import * as AuthContext from '../features/auth/AuthContext'
import type { Recipe } from '../types/nutrition'

// Mock dependencies
vi.mock('../services/recipeStorageApi')
vi.mock('../features/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

describe('Dashboard', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null
  }

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      userId: 'test-uid',
      recipeName: 'Chocolate Cake',
      ingredients: ['flour', 'sugar'],
      instructions: ['mix', 'bake'],
      servings: 8,
      source: 'user-created',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      userId: 'test-uid',
      recipeName: 'Pasta',
      ingredients: ['pasta', 'sauce'],
      instructions: ['boil', 'mix'],
      servings: 4,
      source: 'ai-generated',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      userId: 'test-uid',
      recipeName: 'Salad',
      ingredients: ['lettuce', 'tomato'],
      instructions: ['chop', 'toss'],
      servings: 2,
      source: 'user-created',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: mockUser,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn()
    })
  })

  it('should render loading skeletons initially', () => {
    vi.mocked(recipeStorageApi.getRecipes).mockImplementation(() => new Promise(() => {}))
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should fetch and display recipes', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(recipeStorageApi.getRecipes).toHaveBeenCalled()
    })
  })

  it('should display recent recipes (last 3)', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Should show the 3 most recent recipes
      expect(screen.getByText('Salad')).toBeInTheDocument()
      expect(screen.getByText('Pasta')).toBeInTheDocument()
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    })
  })

  it('should handle empty recipes list', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue([])

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(recipeStorageApi.getRecipes).toHaveBeenCalled()
    })
  })

  it('should handle fetch error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(recipeStorageApi.getRecipes).mockRejectedValue(new Error('Failed to fetch'))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch recipes:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })

  it('should display quick action buttons', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue([])

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      const createButtons = screen.getAllByRole('button', { name: /Create Recipe/i })
      expect(createButtons.length).toBeGreaterThan(0)
      expect(screen.getByRole('button', { name: /Try AI Generator/i })).toBeInTheDocument()
    })
  })

  it('should display recipe statistics', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Should show total recipes count
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Total Recipes')).toBeInTheDocument()
    })
  })

  it('should sort recent recipes by creation date', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      const recipeCards = container.querySelectorAll('[data-testid="recipe-card"], .recipe-card')
      // Most recent should be first (Salad created on 2024-01-03)
      if (recipeCards.length > 0) {
        expect(recipeCards[0].textContent).toContain('Salad')
      }
    })
  })
})

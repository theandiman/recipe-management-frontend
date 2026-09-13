import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '../store'
import { recipeApi } from '../services/recipeApi'
import { Dashboard } from './Dashboard'
import * as recipeStorageApi from '../services/recipeStorageApi'
import * as AuthContext from '../features/auth/AuthContext'
import * as SavedRecipesContext from '../features/recipes/SavedRecipesContext'
import * as notificationApi from '../services/notificationApi'
import type { Recipe } from '../types/nutrition'

// Mock dependencies
vi.mock('../services/recipeStorageApi')
vi.mock('../services/notificationApi')
vi.mock('../features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))
vi.mock('../features/recipes/SavedRecipesContext', () => ({
  useSavedRecipes: vi.fn(),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock BookmarkButton to avoid SavedRecipesContext dependencies
vi.mock('../components/BookmarkButton', () => ({
  default: () => null,
  BookmarkButton: () => null,
}))

// Mock LikeButton to avoid LikeContext dependencies
vi.mock('../components/LikeButton', () => ({
  default: () => null,
  LikeButton: () => null,
}))

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  )

describe('Dashboard', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Chef Andy',
    photoURL: null,
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
      updatedAt: '2024-01-01T00:00:00Z',
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
      updatedAt: '2024-01-02T00:00:00Z',
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
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    store.dispatch(recipeApi.util.resetApiState())

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: mockUser,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      refreshUser: vi.fn(),
    })

    vi.mocked(SavedRecipesContext.useSavedRecipes).mockReturnValue({
      savedIds: new Set(),
      savedRecipes: [],
      isSaved: vi.fn(),
      toggleSave: vi.fn(),
      isLoading: false,
      reload: vi.fn(),
    })

    vi.mocked(recipeStorageApi.getFeed).mockResolvedValue([])
    vi.mocked(notificationApi.getNotifications).mockResolvedValue({
      unreadCount: 0,
      notifications: [],
      hasMore: false,
    })
  })

  it('renders greeting with user display name and creation buttons', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    renderWithProviders(<Dashboard />)

    expect(screen.getByText('Chef Andy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Recipe/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate with AI/i })).toBeInTheDocument()
  })

  it('renders followed cooks feed, saved recipes continuation, and recent activity sections', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('From cooks you follow')).toBeInTheDocument()
      expect(screen.getByText('Continue Cooking')).toBeInTheDocument()
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })
  })

  it('renders your recent recipes when user has recipes in their cookbook', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Your Recent Recipes')).toBeInTheDocument()
      expect(screen.getByText('Salad')).toBeInTheDocument()
      expect(screen.getByText('Pasta')).toBeInTheDocument()
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    })
  })

  it('renders new-user onboarding when user has zero recipes', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue([])

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Get started with CookFlow')).toBeInTheDocument()
      expect(screen.getByText('Discover the Community')).toBeInTheDocument()
    })
  })

  it('handles fetch error gracefully without crashing dashboard and shows retry button instead of onboarding', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(recipeStorageApi.getRecipes).mockRejectedValueOnce(new Error('Failed to fetch recipes'))

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch recipes:', expect.any(Error))
      // Dashboard still renders greeting and sections even if personal recipes fail
      expect(screen.getByText('Chef Andy')).toBeInTheDocument()
      expect(screen.getByText('From cooks you follow')).toBeInTheDocument()
      // Shows error alert with retry button and does NOT show onboarding to existing user
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch recipes')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
      expect(screen.queryByText('Get started with CookFlow')).not.toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })

  it('does not render duplicate hero search bar or old FYP recommendations', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Search recipes, ingredients, or tags/i)).not.toBeInTheDocument()
      expect(screen.queryByText('Recommended For You')).not.toBeInTheDocument()
    })
  })

  it('renders cookbook snapshot stats card in the sidebar', async () => {
    vi.mocked(recipeStorageApi.getRecipes).mockResolvedValue(mockRecipes)

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Cookbook Snapshot')).toBeInTheDocument()
      expect(screen.getByText('Recipes Created')).toBeInTheDocument()
      expect(screen.getByText('Saved to Make')).toBeInTheDocument()
    })
  })
})

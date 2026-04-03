import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SavedRecipesPage } from './SavedRecipesPage'
import type { Recipe } from '../../types/nutrition'

// Mock useSavedRecipes
const mockUseSavedRecipes = vi.fn()
vi.mock('./SavedRecipesContext', () => ({
  useSavedRecipes: () => mockUseSavedRecipes()
}))

// Mock useAuth
vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { uid: 'user-1', email: 'test@example.com' }
  })
}))

// Mock RecipeCard
vi.mock('../../components/RecipeCard', () => ({
  default: ({ recipe, onView }: { recipe: Recipe; onView?: (id: string) => void }) => (
    <div data-testid={`recipe-card-${recipe.id}`} onClick={() => onView?.(recipe.id!)}>
      {recipe.recipeName}
    </div>
  ),
  RecipeCard: ({ recipe, onView }: { recipe: Recipe; onView?: (id: string) => void }) => (
    <div data-testid={`recipe-card-${recipe.id}`} onClick={() => onView?.(recipe.id!)}>
      {recipe.recipeName}
    </div>
  )
}))

// Mock RecipeCardSkeleton
vi.mock('../../components/skeletons/RecipeCardSkeleton', () => ({
  RecipeCardSkeleton: () => <div data-testid="skeleton" />
}))

const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    recipeName: 'Pasta Carbonara',
    ingredients: ['pasta', 'eggs'],
    instructions: ['Cook pasta', 'Mix eggs'],
    servings: 4,
    source: 'manual'
  },
  {
    id: 'r2',
    recipeName: 'Chocolate Cake',
    ingredients: ['flour', 'sugar'],
    instructions: ['Mix', 'Bake'],
    servings: 8,
    source: 'manual'
  }
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <SavedRecipesPage />
    </MemoryRouter>
  )

describe('SavedRecipesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    it('shows skeletons while loading', () => {
      mockUseSavedRecipes.mockReturnValue({
        savedRecipes: [],
        isLoading: true,
        reload: vi.fn()
      })
      renderPage()
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    })

    it('shows page heading while loading', () => {
      mockUseSavedRecipes.mockReturnValue({
        savedRecipes: [],
        isLoading: true,
        reload: vi.fn()
      })
      renderPage()
      expect(screen.getByRole('heading', { name: /saved recipes/i })).toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no recipes are saved', () => {
      mockUseSavedRecipes.mockReturnValue({
        savedRecipes: [],
        isLoading: false,
        reload: vi.fn()
      })
      renderPage()
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText(/no saved recipes yet/i)).toBeInTheDocument()
    })

    it('shows a "Browse Recipes" button in the empty state', () => {
      mockUseSavedRecipes.mockReturnValue({
        savedRecipes: [],
        isLoading: false,
        reload: vi.fn()
      })
      renderPage()
      expect(screen.getByRole('button', { name: /browse recipes/i })).toBeInTheDocument()
    })
  })

  describe('Recipe list', () => {
    it('renders all saved recipe cards', () => {
      mockUseSavedRecipes.mockReturnValue({
        savedRecipes: mockRecipes,
        isLoading: false,
        reload: vi.fn()
      })
      renderPage()
      expect(screen.getByTestId('recipe-card-r1')).toBeInTheDocument()
      expect(screen.getByTestId('recipe-card-r2')).toBeInTheDocument()
    })

    it('shows correct count in subtitle', () => {
      mockUseSavedRecipes.mockReturnValue({
        savedRecipes: mockRecipes,
        isLoading: false,
        reload: vi.fn()
      })
      renderPage()
      expect(screen.getByText(/2 recipes saved/i)).toBeInTheDocument()
    })

    it('shows singular label for one recipe', () => {
      mockUseSavedRecipes.mockReturnValue({
        savedRecipes: [mockRecipes[0]],
        isLoading: false,
        reload: vi.fn()
      })
      renderPage()
      expect(screen.getByText(/1 recipe saved/i)).toBeInTheDocument()
    })
  })

  describe('reload on mount', () => {
    it('calls reload on mount', () => {
      const reload = vi.fn().mockResolvedValue(undefined)
      mockUseSavedRecipes.mockReturnValue({
        savedRecipes: [],
        isLoading: false,
        reload
      })
      renderPage()
      expect(reload).toHaveBeenCalled()
    })
  })
})

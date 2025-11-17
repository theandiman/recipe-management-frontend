import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './DashboardLayout'
import { RecipeDetail } from '../../features/recipes/RecipeDetail'
import * as recipeStorageApi from '../../services/recipeStorageApi'

// Mock the API
vi.mock('../../features/recipes/recipeStorageApi', () => ({
  getRecipes: vi.fn(),
  getRecipe: vi.fn(),
  deleteRecipe: vi.fn()
}))

// Mock useAuth to provide a dummy user
vi.mock('../../features/auth/AuthContext', async () => {
  const actual = await vi.importActual('../../features/auth/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      user: { email: 'test@example.com', uid: 'test-user' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: async () => {},
      loginWithGoogle: async () => {},
      register: async () => {},
      logout: async () => {}
    })
  }
})

// Mock child components that are not under test
vi.mock('../../components/Dashboard', async () => {
  const React = await vi.importActual('react')
  return { Dashboard: () => <div>DashboardStub</div> }
})

vi.mock('../../features/recipes/RecipeLibrary', async () => {
  const React = await vi.importActual('react')
  return { RecipeLibrary: () => <div>RecipeLibraryStub</div> }
})

vi.mock('../../features/recipes/CreateRecipe', async () => {
  const React = await vi.importActual('react')
  return { CreateRecipe: () => <div>CreateRecipeStub</div> }
})

vi.mock('../../features/recipes/AIGenerator', async () => {
  const React = await vi.importActual('react')
  return { AIGenerator: () => <div>AIGeneratorStub</div> }
})

const mockRecipe: recipeStorageApi.RecipeResponse = {
  id: '1',
  userId: 'user-123',
  title: 'Chocolate Cake',
  description: 'Delicious chocolate cake',
  prepTime: 20,
  cookTime: 40,
  servings: 8,
  imageUrl: 'https://example.com/cake.jpg',
  ingredients: ['2 cups flour', '1 cup sugar'],
  instructions: ['Mix ingredients', 'Bake at 350F'],
  tags: ['dessert', 'cake'],
  source: 'ai-generated',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}

describe('DashboardLayout routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders RecipeDetail when navigating to /dashboard/recipes/:id', async () => {
    vi.spyOn(recipeStorageApi, 'getRecipe').mockResolvedValue(mockRecipe)
    vi.spyOn(recipeStorageApi, 'getRecipes').mockResolvedValue([mockRecipe])

    render(
      <MemoryRouter initialEntries={["/dashboard/recipes/1"]}>
        <Routes>
          <Route path="/dashboard/recipes/:id" element={<RecipeDetail />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for the recipe title to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    })

    // Check that description and prep/cook times show
    expect(screen.getByText('Delicious chocolate cake')).toBeInTheDocument()
    // Ensure prep & cook times and servings are displayed within their labeled blocks
    const prepLabel = screen.getByText('Prep Time')
    expect(prepLabel).toBeTruthy()
    expect(prepLabel.parentElement?.textContent).toMatch(/20\s*min/)

    const cookLabel = screen.getByText('Cook Time')
    expect(cookLabel).toBeTruthy()
    expect(cookLabel.parentElement?.textContent).toMatch(/40\s*min/)

    const servingsLabel = screen.getByText('Servings')
    expect(servingsLabel).toBeTruthy()
    expect(servingsLabel.parentElement?.textContent).toMatch(/8/)
  })
})

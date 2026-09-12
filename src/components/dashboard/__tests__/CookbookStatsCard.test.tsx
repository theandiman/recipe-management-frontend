import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { CookbookStatsCard } from '../CookbookStatsCard'
import * as SavedRecipesContext from '../../../features/recipes/SavedRecipesContext'
import type { Recipe } from '../../../types/nutrition'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../features/recipes/SavedRecipesContext', () => ({
  useSavedRecipes: vi.fn(),
}))

describe('CookbookStatsCard', () => {
  const mockSaved: Recipe[] = [
    {
      id: 'saved-1',
      recipeName: 'Tiramisu',
      ingredients: [],
      instructions: [],
      servings: 4,
      source: 'user-created',
    },
    {
      id: 'saved-2',
      recipeName: 'Pad Thai',
      ingredients: [],
      instructions: [],
      servings: 2,
      source: 'user-created',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recipe count and saved count correctly', () => {
    vi.mocked(SavedRecipesContext.useSavedRecipes).mockReturnValue({
      savedIds: new Set(['saved-1', 'saved-2']),
      savedRecipes: mockSaved,
      isSaved: vi.fn(),
      toggleSave: vi.fn(),
      isLoading: false,
      reload: vi.fn(),
    })

    render(
      <BrowserRouter>
        <CookbookStatsCard recipesCount={7} />
      </BrowserRouter>
    )

    expect(screen.getByText('Cookbook Snapshot')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Recipes Created')).toBeInTheDocument()
    expect(screen.getByText('Saved to Make')).toBeInTheDocument()
  })

  it('navigates to relevant routes when buttons/pills are clicked', () => {
    vi.mocked(SavedRecipesContext.useSavedRecipes).mockReturnValue({
      savedIds: new Set(),
      savedRecipes: [],
      isSaved: vi.fn(),
      toggleSave: vi.fn(),
      isLoading: false,
      reload: vi.fn(),
    })

    render(
      <BrowserRouter>
        <CookbookStatsCard recipesCount={3} />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByText('My Cookbook →'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes')

    fireEvent.click(screen.getByText('Explore Community'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/community')

    fireEvent.click(screen.getByText('+ New Recipe'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/create')
  })
})

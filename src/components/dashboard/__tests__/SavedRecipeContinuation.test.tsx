import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SavedRecipeContinuation } from '../SavedRecipeContinuation'
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

vi.mock('../../BookmarkButton', () => ({
  default: () => <button data-testid="bookmark-btn">Bookmark</button>,
  BookmarkButton: () => <button data-testid="bookmark-btn">Bookmark</button>,
}))

vi.mock('../../LikeButton', () => ({
  default: () => <button data-testid="like-btn">Like</button>,
  LikeButton: () => <button data-testid="like-btn">Like</button>,
}))

describe('SavedRecipeContinuation', () => {
  const mockSaved: Recipe[] = [
    {
      id: 'saved-1',
      userId: 'user-a',
      recipeName: 'Tiramisu',
      ingredients: ['mascarpone', 'espresso'],
      instructions: ['dip', 'layer', 'chill'],
      servings: 8,
      source: 'user-created',
    },
    {
      id: 'saved-2',
      userId: 'user-b',
      recipeName: 'Pad Thai',
      ingredients: ['rice noodles', 'tofu'],
      instructions: ['stir fry'],
      servings: 2,
      source: 'user-created',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton when SavedRecipesContext is loading', () => {
    vi.mocked(SavedRecipesContext.useSavedRecipes).mockReturnValue({
      savedIds: new Set(),
      savedRecipes: [],
      isSaved: vi.fn(),
      toggleSave: vi.fn(),
      isLoading: true,
      reload: vi.fn(),
    })

    render(
      <BrowserRouter>
        <SavedRecipeContinuation />
      </BrowserRouter>
    )

    expect(screen.getByTestId('saved-loading-skeleton')).toBeInTheDocument()
    expect(screen.getByText('Continue Cooking')).toBeInTheDocument()
  })

  it('renders saved recipes and link to saved recipes page on populated state', () => {
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
        <SavedRecipeContinuation />
      </BrowserRouter>
    )

    expect(screen.getByText('Tiramisu')).toBeInTheDocument()
    expect(screen.getByText('Pad Thai')).toBeInTheDocument()

    const viewAllBtn = screen.getByRole('button', { name: /View all saved \(2\) →/i })
    expect(viewAllBtn).toBeInTheDocument()
    fireEvent.click(viewAllBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/saved')
  })

  it('renders empty bookmark discovery state with Community link', () => {
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
        <SavedRecipeContinuation />
      </BrowserRouter>
    )

    expect(screen.getByText('No saved recipes yet')).toBeInTheDocument()

    const exploreBtn = screen.getByRole('button', { name: /Explore Community Recipes/i })
    expect(exploreBtn).toBeInTheDocument()
    fireEvent.click(exploreBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/community')
  })
})

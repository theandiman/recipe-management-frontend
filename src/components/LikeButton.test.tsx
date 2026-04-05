import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LikeButton from './LikeButton'
import type { Recipe } from '../types/nutrition'

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock useLikeContext
const mockGetLikeState = vi.fn()
const mockInitRecipe = vi.fn()
const mockToggleLike = vi.fn()
vi.mock('../features/recipes/LikeContext', () => ({
  useLikeContext: () => ({
    getLikeState: mockGetLikeState,
    initRecipe: mockInitRecipe,
    toggleLike: mockToggleLike,
  })
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockRecipe = {
  id: 'recipe-1',
  recipeName: 'Chocolate Cake',
  ingredients: [],
  instructions: [],
  servings: 4,
  source: 'manual',
  likeCount: 5,
  isLikedByCurrentUser: false,
} as unknown as Recipe

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('LikeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockGetLikeState.mockReturnValue(undefined)
    mockInitRecipe.mockReturnValue(undefined)
    mockToggleLike.mockResolvedValue(undefined)
  })

  it('renders with like count from recipe data when context has no state', () => {
    renderWithRouter(<LikeButton recipe={mockRecipe} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /like chocolate cake/i })).toBeInTheDocument()
  })

  it('renders filled heart when liked', () => {
    mockGetLikeState.mockReturnValue({ isLiked: true, likeCount: 6 })
    renderWithRouter(<LikeButton recipe={mockRecipe} />)
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unlike chocolate cake/i })).toBeInTheDocument()
  })

  it('renders outline heart when not liked', () => {
    mockGetLikeState.mockReturnValue({ isLiked: false, likeCount: 5 })
    renderWithRouter(<LikeButton recipe={mockRecipe} />)
    expect(screen.getByRole('button', { name: /like chocolate cake/i })).toBeInTheDocument()
  })

  it('calls toggleLike when authenticated user clicks', async () => {
    const user = userEvent.setup()
    mockGetLikeState.mockReturnValue({ isLiked: false, likeCount: 5 })
    renderWithRouter(<LikeButton recipe={mockRecipe} />)

    await user.click(screen.getByRole('button'))
    expect(mockToggleLike).toHaveBeenCalledWith('recipe-1')
  })

  it('redirects to login when unauthenticated user clicks', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    mockGetLikeState.mockReturnValue({ isLiked: false, likeCount: 5 })
    renderWithRouter(<LikeButton recipe={mockRecipe} />)

    await user.click(screen.getByRole('button'))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(mockToggleLike).not.toHaveBeenCalled()
  })

  it('initializes recipe state on mount', () => {
    renderWithRouter(<LikeButton recipe={mockRecipe} />)
    expect(mockInitRecipe).toHaveBeenCalledWith('recipe-1', false, 5)
  })

  it('renders the recipe like count even if recipe has no id', () => {
    const recipeNoId = { ...mockRecipe, id: undefined }
    renderWithRouter(<LikeButton recipe={recipeNoId} />)
    // Button still renders and shows the recipe-provided like count.
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})

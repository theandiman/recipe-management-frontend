import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecipeListItem } from './RecipeListItem'
import type { Recipe } from '../types/nutrition'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('./BookmarkButton', () => ({
  default: () => <button data-testid="bookmark-button">Bookmark</button>,
}))

vi.mock('./LikeButton', () => ({
  default: () => <button data-testid="like-button">Like</button>,
}))

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('RecipeListItem', () => {
  const mockRecipe = {
    id: 'rec-123',
    recipeName: 'Spaghetti Bolognese',
    description: 'Hearty Italian pasta dish with rich meat sauce',
    servings: 4,
    prepTime: '20',
    cookTime: '40',
    totalTimeMinutes: 60,
    imageUrl: 'https://example.com/spaghetti.jpg',
    tags: ['pasta', 'italian', 'dinner'],
    userId: 'chef-1',
    author: 'Chef Mario',
    isPublic: true,
    averageRating: 4.8,
    ingredients: [],
    instructions: [],
    source: 'manual',
  } as unknown as Recipe

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recipe title, description, tags, and image', () => {
    renderWithRouter(<RecipeListItem recipe={mockRecipe} />)

    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument()
    expect(screen.getByText('Hearty Italian pasta dish with rich meat sauce')).toBeInTheDocument()
    expect(screen.getByText('#pasta')).toBeInTheDocument()
    expect(screen.getByText('#italian')).toBeInTheDocument()
    expect(screen.getByText('#dinner')).toBeInTheDocument()
    expect(screen.getByText('60 min')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText(/4.8/)).toBeInTheDocument()
  })

  it('renders fallback initial when recipe has no image', () => {
    const noImageRecipe = { ...mockRecipe, imageUrl: undefined }
    renderWithRouter(<RecipeListItem recipe={noImageRecipe} />)

    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('renders author chip and public badge when provided', () => {
    renderWithRouter(
      <RecipeListItem
        recipe={mockRecipe}
        authorUid="chef-1"
        authorName="Chef Mario"
        authorAvatarUrl="https://example.com/mario.jpg"
      />
    )

    expect(screen.getByText('Chef Mario')).toBeInTheDocument()
    expect(screen.getByText(/Public/)).toBeInTheDocument()
    const authorLink = screen.getByText('Chef Mario').closest('a')
    expect(authorLink).toHaveAttribute('href', '/user/chef-1')
  })

  it('navigates on row click when onView is not provided', () => {
    renderWithRouter(<RecipeListItem recipe={mockRecipe} />)

    fireEvent.click(screen.getByRole('button', { name: /Spaghetti Bolognese/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/recipes/rec-123')
  })

  it('calls onView callback when row is clicked', () => {
    const onViewSpy = vi.fn()
    renderWithRouter(<RecipeListItem recipe={mockRecipe} onView={onViewSpy} />)

    fireEvent.click(screen.getByRole('button', { name: /Spaghetti Bolognese/i }))
    expect(onViewSpy).toHaveBeenCalledWith('rec-123')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders Bookmark and Like buttons when showBookmark and showLike are enabled', () => {
    renderWithRouter(
      <RecipeListItem recipe={mockRecipe} showBookmark={true} showLike={true} />
    )

    expect(screen.getByTestId('bookmark-button')).toBeInTheDocument()
    expect(screen.getByTestId('like-button')).toBeInTheDocument()
  })

  it('does not render Bookmark or Like buttons when flags are false', () => {
    renderWithRouter(
      <RecipeListItem recipe={mockRecipe} showBookmark={false} showLike={false} />
    )

    expect(screen.queryByTestId('bookmark-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('like-button')).not.toBeInTheDocument()
  })

  it('renders delete button for owner and triggers onDelete on click', () => {
    const onDeleteSpy = vi.fn()
    renderWithRouter(
      <RecipeListItem
        recipe={mockRecipe}
        isOwner={true}
        onDelete={onDeleteSpy}
      />
    )

    const deleteBtn = screen.getByRole('button', { name: /Delete Spaghetti Bolognese/i })
    expect(deleteBtn).toBeInTheDocument()

    fireEvent.click(deleteBtn)
    expect(onDeleteSpy).toHaveBeenCalledWith(mockRecipe)
    // Row click should NOT have been triggered
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

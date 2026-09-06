import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RecipeCard from './RecipeCard'
import type { Recipe } from '../types/nutrition'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('./BookmarkButton', () => ({
  default: () => <button data-testid="bookmark-button">Bookmark</button>,
}))

vi.mock('./LikeButton', () => ({
  default: () => <button data-testid="like-button">Like</button>,
}))

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('RecipeCard', () => {
  const mockRecipe: Recipe = {
    id: '123',
    recipeName: 'Test Recipe',
    description: 'A delicious test recipe',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    totalTimeMinutes: 45,
    imageUrl: 'https://example.com/recipe.jpg',
    ingredients: [],
    instructions: [],
    userId: 'user123',
    source: 'manual'
  }

  it('should render recipe name and description', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    
    expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    expect(screen.getByText('A delicious test recipe')).toBeInTheDocument()
  })

  it('should display total time when available', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    
    expect(screen.getByText('45 min')).toBeInTheDocument()
  })

  it('should display servings', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    
    expect(screen.getByText('4 servings')).toBeInTheDocument()
  })

  it('should display recipe image', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    
    // Image is decorative (alt="") because the title is conveyed via visible text overlay
    const img = document.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/recipe.jpg')
    expect(img).toHaveAttribute('alt', '')
  })

  it('should show placeholder when no image', () => {
    const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined }
    render(<RecipeCard recipe={recipeWithoutImage} />)
    
    // Should show SVG placeholder instead of img tag
    expect(screen.queryByAltText('Test Recipe')).not.toBeInTheDocument()
  })

  it('should call onView when card is clicked', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    
    const { container } = render(<RecipeCard recipe={mockRecipe} onView={onView} />)
    
    // Click on the card div (not the delete button)
    const card = container.querySelector('[role="button"][tabindex="0"]')
    await user.click(card!)
    
    expect(onView).toHaveBeenCalledWith('123')
  })

  it('should call onView when Enter key is pressed', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    
    const { container } = render(<RecipeCard recipe={mockRecipe} onView={onView} />)
    
    const card = container.querySelector('[role="button"][tabindex="0"]') as HTMLElement
    card.focus()
    await user.keyboard('{Enter}')
    
    expect(onView).toHaveBeenCalledWith('123')
  })

  it('should call onView when Space key is pressed', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    
    const { container } = render(<RecipeCard recipe={mockRecipe} onView={onView} />)
    
    const card = container.querySelector('[role="button"][tabindex="0"]') as HTMLElement
    card.focus()
    await user.keyboard(' ')
    
    expect(onView).toHaveBeenCalledWith('123')
  })

  it('should call onDelete when delete button is clicked in the menu', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    
    render(<RecipeCard recipe={mockRecipe} onDelete={onDelete} />)
    
    await user.click(screen.getByTestId('recipe-card-menu-button'))
    await user.click(screen.getByLabelText('Delete Test Recipe'))
    
    expect(onDelete).toHaveBeenCalledWith(mockRecipe)
  })

  it('should not call onView when delete button is clicked in the menu', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const onDelete = vi.fn()
    
    render(<RecipeCard recipe={mockRecipe} onView={onView} onDelete={onDelete} />)
    
    await user.click(screen.getByTestId('recipe-card-menu-button'))
    await user.click(screen.getByLabelText('Delete Test Recipe'))
    
    expect(onDelete).toHaveBeenCalled()
    expect(onView).not.toHaveBeenCalled()
  })

  it('should calculate total time from prep and cook when totalTimeMinutes is not provided', () => {
    const recipeWithoutTotal = {
      ...mockRecipe,
      totalTimeMinutes: undefined
    }
    render(<RecipeCard recipe={recipeWithoutTotal} />)
    
    expect(screen.getByText('45 min')).toBeInTheDocument()
  })

  it('should fall back to prep/cook string display when no time numbers available', () => {
    const recipeWithStrings = {
      ...mockRecipe,
      totalTimeMinutes: undefined,
      prepTimeMinutes: undefined,
      cookTimeMinutes: undefined,
      prepTime: '15 min',
      cookTime: '30 min'
    } as unknown as Recipe
    
    render(<RecipeCard recipe={recipeWithStrings} />)
    
    expect(screen.getByText('15 min 30 min')).toBeInTheDocument()
  })

  it('should not display time if no time data is available', () => {
    const recipeWithoutTime = {
      ...mockRecipe,
      totalTimeMinutes: undefined,
      prepTimeMinutes: undefined,
      cookTimeMinutes: undefined
    }
    render(<RecipeCard recipe={recipeWithoutTime} />)
    
    // Should only show servings, not time
    expect(screen.getByText('4 servings')).toBeInTheDocument()
    expect(screen.queryByText(/min/)).not.toBeInTheDocument()
  })

  it('should not call onView if recipe has no id', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const recipeWithoutId = { ...mockRecipe, id: undefined }
    
    const { container } = render(<RecipeCard recipe={recipeWithoutId} onView={onView} />)
    
    const card = container.querySelector('[role="button"][tabindex="0"]')
    await user.click(card!)
    
    expect(onView).not.toHaveBeenCalled()
  })

  it('should display a Public badge when isPublic is true', () => {
    const publicRecipe = { ...mockRecipe, isPublic: true }
    render(<RecipeCard recipe={publicRecipe} />)

    expect(screen.getByTestId('public-badge')).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('should not display a Public badge when isPublic is false', () => {
    const privateRecipe = { ...mockRecipe, isPublic: false }
    render(<RecipeCard recipe={privateRecipe} />)

    expect(screen.queryByTestId('public-badge')).not.toBeInTheDocument()
    expect(screen.queryByText('Public')).not.toBeInTheDocument()
  })

  it('should not display a Public badge when isPublic is undefined', () => {
    const recipeWithoutPublicFlag = { ...mockRecipe, isPublic: undefined }
    render(<RecipeCard recipe={recipeWithoutPublicFlag} />)

    expect(screen.queryByTestId('public-badge')).not.toBeInTheDocument()
    expect(screen.queryByText('Public')).not.toBeInTheDocument()
  })

  it('should render in compact mode', () => {
    const { container } = render(<RecipeCard recipe={mockRecipe} compact />)
    // Select the main card container (assumed to be [role="button"][tabindex="0"])
    const card = container.querySelector('[role="button"][tabindex="0"]')
    expect(card).toBeInTheDocument()
    expect(card?.classList.contains('p-0')).toBe(true)
  })

  describe('author chip', () => {
    it('should not render author chip when authorUid is not provided', () => {
      renderWithRouter(<RecipeCard recipe={mockRecipe} />)
      expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument()
    })

    it('should render author chip with authorName when authorUid and authorName are provided', () => {
      renderWithRouter(
        <RecipeCard recipe={mockRecipe} authorUid="user123" authorName="Jane Chef" />
      )
      const link = screen.getByRole('link', { name: "View Jane Chef's profile" })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/user/user123')
      expect(screen.getByText('Jane Chef')).toBeInTheDocument()
    })

    it('should render author chip with fallback label when only authorUid is provided', () => {
      renderWithRouter(<RecipeCard recipe={mockRecipe} authorUid="user123" />)
      const link = screen.getByRole('link', { name: 'View author profile' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/user/user123')
    })

    it('clicking the author chip does not call onView', async () => {
      const user = userEvent.setup()
      const onView = vi.fn()
      renderWithRouter(
        <RecipeCard
          recipe={mockRecipe}
          onView={onView}
          authorUid="user123"
          authorName="Jane Chef"
        />
      )
      const link = screen.getByRole('link', { name: "View Jane Chef's profile" })
      await user.click(link)
      expect(onView).not.toHaveBeenCalled()
    })

    it('pressing Enter on the author chip does not call onView', async () => {
      const user = userEvent.setup()
      const onView = vi.fn()
      renderWithRouter(
        <RecipeCard
          recipe={mockRecipe}
          onView={onView}
          authorUid="user123"
          authorName="Jane Chef"
        />
      )
      const link = screen.getByRole('link', { name: "View Jane Chef's profile" })
      link.focus()
      await user.keyboard('{Enter}')
      expect(onView).not.toHaveBeenCalled()
    })

    it('pressing Space on the author chip does not call onView', async () => {
      const user = userEvent.setup()
      const onView = vi.fn()
      renderWithRouter(
        <RecipeCard
          recipe={mockRecipe}
          onView={onView}
          authorUid="user123"
          authorName="Jane Chef"
        />
      )
      const link = screen.getByRole('link', { name: "View Jane Chef's profile" })
      link.focus()
      await user.keyboard(' ')
      expect(onView).not.toHaveBeenCalled()
    })
  })

  describe('3-dots action menu', () => {
    it('should render 3-dots menu button and open menu on click', async () => {
      const user = userEvent.setup()
      render(<RecipeCard recipe={mockRecipe} />)

      const menuBtn = screen.getByTestId('recipe-card-menu-button')
      expect(menuBtn).toBeInTheDocument()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()

      await user.click(menuBtn)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      expect(screen.getByText('Copy link')).toBeInTheDocument()
    })

    it('should call onEdit when edit option is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      render(<RecipeCard recipe={mockRecipe} onEdit={onEdit} />)

      await user.click(screen.getByTestId('recipe-card-menu-button'))
      const editBtn = screen.getByRole('menuitem', { name: /Edit Test Recipe/i })
      await user.click(editBtn)

      expect(onEdit).toHaveBeenCalledWith(mockRecipe)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should navigate to edit route when onEdit is not provided but recipe is editable', async () => {
      const user = userEvent.setup()
      render(<RecipeCard recipe={mockRecipe} isOwner />)

      await user.click(screen.getByTestId('recipe-card-menu-button'))
      const editBtn = screen.getByRole('menuitem', { name: /Edit Test Recipe/i })
      await user.click(editBtn)

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes/edit/123')
    })

    it('should copy recipe URL to clipboard and show toast', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      render(<RecipeCard recipe={mockRecipe} />)

      await user.click(screen.getByTestId('recipe-card-menu-button'))
      const copyBtn = screen.getByRole('menuitem', { name: /Copy link for Test Recipe/i })
      await user.click(copyBtn)

      expect(writeTextMock).toHaveBeenCalledWith(`${window.location.origin}/recipes/123`)
    })

    it('should close menu when pressing Escape', async () => {
      const user = userEvent.setup()
      render(<RecipeCard recipe={mockRecipe} />)

      await user.click(screen.getByTestId('recipe-card-menu-button'))
      expect(screen.getByRole('menu')).toBeInTheDocument()

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('front-facing actions', () => {
    it('should render front-facing LikeButton when showLike is true', () => {
      render(<RecipeCard recipe={mockRecipe} showLike />)

      expect(screen.getAllByTestId('like-button').length).toBeGreaterThanOrEqual(1)
    })

    it('should render BookmarkButton when showBookmark is true', () => {
      render(<RecipeCard recipe={mockRecipe} showBookmark />)

      expect(screen.getAllByTestId('bookmark-button').length).toBeGreaterThanOrEqual(1)
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecipeCard from './RecipeCard'
import type { Recipe } from '../types/nutrition'

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
    
    const img = screen.getByAltText('Test Recipe')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/recipe.jpg')
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

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    
    render(<RecipeCard recipe={mockRecipe} onDelete={onDelete} />)
    
    await user.click(screen.getByLabelText('Delete Test Recipe'))
    
    expect(onDelete).toHaveBeenCalledWith(mockRecipe)
  })

  it('should not call onView when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const onDelete = vi.fn()
    
    render(<RecipeCard recipe={mockRecipe} onView={onView} onDelete={onDelete} />)
    
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

  it('should render in compact mode', () => {
    const { container } = render(<RecipeCard recipe={mockRecipe} compact />)
    // Select the main card container (assumed to be [role="button"][tabindex="0"])
    const card = container.querySelector('[role="button"][tabindex="0"]')
    expect(card).toBeInTheDocument()
    expect(card?.classList.contains('p-0')).toBe(true)
  })
})

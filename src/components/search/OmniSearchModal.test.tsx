import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OmniSearchModal } from './OmniSearchModal'
import * as recipeApi from '../../services/recipeStorageApi'
import type { Recipe } from '../../types/nutrition'

vi.mock('../../services/recipeStorageApi', () => ({
  getRecipes: vi.fn(),
}))

const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    recipeName: 'Creamy Garlic Pasta',
    description: 'Delicious Italian pasta with garlic cream sauce.',
    tags: ['Italian', 'Pasta', 'Quick'],
    prepTimeMinutes: 15,
    ingredients: ['garlic', 'pasta', 'cream'],
    instructions: ['Cook pasta', 'Make sauce'],
    servings: 2,
    source: 'manual',
  },
  {
    id: 'r2',
    recipeName: 'Keto Avocado Salad',
    description: 'Fresh avocado and greens.',
    tags: ['Keto', 'Salad', 'Healthy'],
    prepTimeMinutes: 10,
    ingredients: ['avocado', 'greens'],
    instructions: ['Chop avocado', 'Mix greens'],
    servings: 1,
    source: 'manual',
  },
]

describe('OmniSearchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(recipeApi.getRecipes).mockResolvedValue(mockRecipes)
    localStorage.clear()
  })

  it('should render dialog when isOpen is true', async () => {
    render(
      <MemoryRouter>
        <OmniSearchModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search recipes, tags, ingredients/i)).toBeInTheDocument()
  })

  it('should not render dialog when isOpen is false', () => {
    render(
      <MemoryRouter>
        <OmniSearchModal isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should filter recipes as user types in search input', async () => {
    render(
      <MemoryRouter>
        <OmniSearchModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/Search recipes, tags, ingredients/i)
    fireEvent.change(input, { target: { value: 'Pasta' } })

    await waitFor(() => {
      expect(screen.getByText('Creamy Garlic Pasta')).toBeInTheDocument()
      expect(screen.queryByText('Keto Avocado Salad')).not.toBeInTheDocument()
    })
  })

  it('should show matching tags', async () => {
    render(
      <MemoryRouter>
        <OmniSearchModal isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/Search recipes, tags, ingredients/i)
    fireEvent.change(input, { target: { value: 'Italian' } })

    await waitFor(() => {
      expect(screen.getByText('#Italian')).toBeInTheDocument()
    })
  })

  it('should call onClose when ESC key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <MemoryRouter>
        <OmniSearchModal isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    )

    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog.children[1], { key: 'Escape' })

    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})

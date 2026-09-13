import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PrintRecipeModal } from '../PrintRecipeModal'
import type { Recipe } from '../../../../types/nutrition'

const mockRecipe: Recipe = {
  id: 'recipe-1',
  recipeName: 'Spaghetti Bolognese',
  description: 'Rich and savory slow-simmered beef ragù.',
  prepTimeMinutes: 15,
  cookTimeMinutes: 45,
  servings: 4,
  imageUrl: 'https://example.com/bolognese.jpg',
  ingredients: ['400g spaghetti', '500g ground beef', '1 can crushed tomatoes'],
  instructions: ['Brown beef in olive oil.', 'Simmer with tomatoes for 45 minutes.'],
  nutritionalInfo: {
    perServing: {
      calories: 550,
      protein: 28,
      carbohydrates: 65,
      fat: 18,
    },
  },
  tips: {
    storage: 'Keeps 4 days in the fridge.',
  },
  source: 'user',
}

describe('PrintRecipeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal controls and preview when open', () => {
    render(
      <PrintRecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Print Recipe/i)).toBeInTheDocument()
    expect(screen.getByText(/Include photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Include nutrition/i)).toBeInTheDocument()
    expect(screen.getByText(/Include tips/i)).toBeInTheDocument()
    expect(screen.getByText(/Include cook's notes/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Print Now/i })[0]).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <PrintRecipeModal
        recipe={mockRecipe}
        isOpen={false}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText(/Print Recipe/i)).not.toBeInTheDocument()
  })

  it('adjusts servings scaling with stepper buttons', () => {
    render(
      <PrintRecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const increaseBtn = screen.getByRole('button', { name: /Increase servings/i })
    fireEvent.click(increaseBtn)

    expect(screen.getAllByText(/5 servings/i).length).toBeGreaterThanOrEqual(1)
  })

  it('triggers window.print when clicking Print Now button', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    render(
      <PrintRecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const printBtn = screen.getAllByRole('button', { name: /Print Now/i })[0]
    fireEvent.click(printBtn)

    expect(printSpy).toHaveBeenCalled()
  })

  it('calls onClose when close or cancel button is clicked', () => {
    const handleClose = vi.fn()

    render(
      <PrintRecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={handleClose}
      />
    )

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelBtn)

    expect(handleClose).toHaveBeenCalled()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AIRemixToolbar } from '../AIRemixToolbar'
import type { Recipe } from '../../../../types/nutrition'

const mockRecipe: Recipe = {
  id: 'r1',
  recipeName: 'Spaghetti Carbonara',
  ingredients: ['Pasta', 'Eggs', 'Pancetta'],
  instructions: ['Boil pasta', 'Fry pancetta'],
  servings: 4,
  source: 'ai',
}

describe('AIRemixToolbar', () => {
  it('renders title and preset remix buttons', () => {
    render(
      <AIRemixToolbar
        recipe={mockRecipe}
        isLoading={false}
        onRemix={vi.fn()}
      />
    )

    expect(screen.getByText('AI Recipe Remix & Tweaks')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Make it Spicier/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Make it Quicker/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Make it Vegan/i })).toBeInTheDocument()
  })

  it('calls onRemix when a preset button is clicked', () => {
    const onRemix = vi.fn()
    render(
      <AIRemixToolbar
        recipe={mockRecipe}
        isLoading={false}
        onRemix={onRemix}
      />
    )

    const spicyBtn = screen.getByRole('button', { name: /Make it Spicier/i })
    fireEvent.click(spicyBtn)

    expect(onRemix).toHaveBeenCalledWith(
      'Make this recipe spicier with extra chili or hot peppers'
    )
  })

  it('calls onRemix with custom instruction when submitted', () => {
    const onRemix = vi.fn()
    render(
      <AIRemixToolbar
        recipe={mockRecipe}
        isLoading={false}
        onRemix={onRemix}
      />
    )

    const input = screen.getByPlaceholderText(/Use coconut milk/i)
    fireEvent.change(input, { target: { value: 'Add mushrooms and garlic' } })

    const remixBtn = screen.getByRole('button', { name: /Remix/i })
    fireEvent.click(remixBtn)

    expect(onRemix).toHaveBeenCalledWith('Add mushrooms and garlic')
  })

  it('disables buttons while isLoading is true', () => {
    render(
      <AIRemixToolbar
        recipe={mockRecipe}
        isLoading={true}
        onRemix={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Make it Spicier/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Remix/i })).toBeDisabled()
  })
})

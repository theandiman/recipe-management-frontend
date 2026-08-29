import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuickJumpNav } from '../QuickJumpNav'

describe('QuickJumpNav', () => {
  it('renders anchor navigation buttons', () => {
    render(<QuickJumpNav hasNutrition={true} hasComments={true} />)

    expect(screen.getByText('Ingredients')).toBeInTheDocument()
    expect(screen.getByText('Instructions')).toBeInTheDocument()
    expect(screen.getByText('Nutrition')).toBeInTheDocument()
    expect(screen.getByText('Discussion')).toBeInTheDocument()
  })

  it('hides nutrition button if hasNutrition is false', () => {
    render(<QuickJumpNav hasNutrition={false} hasComments={true} />)

    expect(screen.getByText('Ingredients')).toBeInTheDocument()
    expect(screen.getByText('Instructions')).toBeInTheDocument()
    expect(screen.queryByText('Nutrition')).not.toBeInTheDocument()
  })

  it('calls scrollTo on anchor button click', () => {
    window.scrollTo = vi.fn() as any

    render(<QuickJumpNav hasNutrition={true} hasComments={true} />)

    const ingredientsBtn = screen.getByText('Ingredients')
    fireEvent.click(ingredientsBtn)

    expect(ingredientsBtn.closest('button')).toHaveClass('bg-emerald-600')
  })
})

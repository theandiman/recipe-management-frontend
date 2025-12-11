import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CookingMode } from './CookingMode'
import type { Recipe } from '../types/nutrition'

describe('CookingMode', () => {
  const mockRecipe: Recipe = {
    id: '1',
    recipeName: 'Test Recipe',
    userId: 'user-1',
    ingredients: ['2 cups flour', '1 cup sugar', '2 eggs'],
    instructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake at 350F'],
    servings: 4,
    source: 'user-created',
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }

  const mockOnClose = vi.fn()

  it('should render with recipe name and initial step', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Mix dry ingredients')).toBeInTheDocument()
  })

  it('should navigate to next step', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    const nextButton = screen.getByTitle('Next step')
    fireEvent.click(nextButton)
    
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(screen.getByText('Add wet ingredients')).toBeInTheDocument()
  })

  it('should navigate to previous step', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    // Go to step 2
    const nextButton = screen.getByTitle('Next step')
    fireEvent.click(nextButton)
    
    // Go back to step 1
    const prevButton = screen.getByTitle('Previous step')
    fireEvent.click(prevButton)
    
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Mix dry ingredients')).toBeInTheDocument()
  })

  it('should not go back from first step', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    const prevButton = screen.getByTitle('Previous step')
    fireEvent.click(prevButton)
    
    // Should still be on step 1
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
  })

  it('should disable next button on last step', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    const nextButton = screen.getByTitle('Next step')
    // Go to last step
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
    
    // Next button should be disabled on last step
    const lastStepButton = screen.getByTitle("You've completed the recipe!")
    expect(lastStepButton).toBeDisabled()
  })

  it('should toggle ingredients view', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    const ingredientsButton = screen.getByText(/View Ingredients/i)
    fireEvent.click(ingredientsButton)
    
    // Should show ingredients
    expect(screen.getByText('Ingredients')).toBeInTheDocument()
    expect(screen.getByText('2 cups flour')).toBeInTheDocument()
    expect(screen.getByText('1 cup sugar')).toBeInTheDocument()
    expect(screen.getByText('2 eggs')).toBeInTheDocument()
    
    // Button should change to "View Steps"
    const stepsButton = screen.getByText(/View Steps/i)
    fireEvent.click(stepsButton)
    
    // Should show instructions again
    expect(screen.getByText('Mix dry ingredients')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    const closeButton = screen.getByTitle('Close cooking mode')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should display progress bar', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    // Progress bar should exist
    const progressBar = document.querySelector('.bg-gradient-to-r.from-emerald-500') as HTMLElement
    expect(progressBar).toBeTruthy()
    
    // Should have some width on first step
    expect(progressBar?.style.width).toBeTruthy()
  })

  it('should render all ingredients when showing ingredients view', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    const ingredientsButton = screen.getByText(/View Ingredients/i)
    fireEvent.click(ingredientsButton)
    
    mockRecipe.ingredients.forEach(ingredient => {
      expect(screen.getByText(ingredient)).toBeInTheDocument()
    })
  })

  it('should maintain step position when toggling ingredients', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    // Go to step 2
    const nextButton = screen.getByTitle('Next step')
    fireEvent.click(nextButton)
    
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    
    // Toggle ingredients
    const ingredientsButton = screen.getByText(/View Ingredients/i)
    fireEvent.click(ingredientsButton)
    
    // Step counter should still show step 2
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    
    // Toggle back
    const stepsButton = screen.getByText(/View Steps/i)
    fireEvent.click(stepsButton)
    
    // Should still be on step 2
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(screen.getByText('Add wet ingredients')).toBeInTheDocument()
  })

  it('should show current step number in large display', () => {
    render(<CookingMode recipe={mockRecipe} onClose={mockOnClose} />)
    
    // Should show step 1
    expect(screen.getByText('1')).toBeInTheDocument()
    
    // Navigate to step 2
    const nextButton = screen.getByTitle('Next step')
    fireEvent.click(nextButton)
    
    // Should show step 2
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})


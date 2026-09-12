import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeFilterDrawer } from './RecipeFilterDrawer'
import { DEFAULT_RECIPE_FILTERS, type RecipeFilterState } from '../../features/recipes/utils/recipeFiltering'

describe('RecipeFilterDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onToggleOpen: vi.fn(),
    filters: DEFAULT_RECIPE_FILTERS,
    availableTags: ['Italian', 'Dinner', 'Quick', 'Dessert'],
    availableIngredients: ['Garlic', 'Tomato', 'Avocado', 'Olive Oil'],
    hideHeaderButton: false,
    matchingCount: 5,
    onFiltersChange: vi.fn(),
    onClearFilters: vi.fn(),
  }

  it('renders dialog with separated Dietary Requirements and Recipe Tags sections', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Filter Recipes')).toBeInTheDocument()
    expect(screen.getByText('Dietary Requirements')).toBeInTheDocument()
    expect(screen.getByText('Recipe Tags')).toBeInTheDocument()
    expect(screen.getByText('Show 5 Recipes')).toBeInTheDocument()
  })

  it('allows selecting dietary requirements via quick popular pills', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)
    const vegButton = screen.getByRole('button', { name: /\+ Vegetarian/i })
    fireEvent.click(vegButton)

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_RECIPE_FILTERS,
      dietaryTags: ['Vegetarian'],
    })
  })

  it('allows toggling prep time limit', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)
    const time30Button = screen.getByRole('button', { name: '< 30m' })
    fireEvent.click(time30Button)

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_RECIPE_FILTERS,
      maxPrepTime: 30,
    })
  })

  it('allows toggling calories limit', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)
    const cal600Button = screen.getByRole('button', { name: '< 600' })
    fireEvent.click(cal600Button)

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_RECIPE_FILTERS,
      maxCalories: 600,
    })
  })

  it('allows adding and removing must-include ingredients', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)
    const input = screen.getByPlaceholderText(/e\.g\. Garlic, Tomato\.\.\./i)
    fireEvent.change(input, { target: { value: 'Garlic' } })

    const addButton = screen.getByRole('button', { name: 'Add' })
    fireEvent.click(addButton)

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_RECIPE_FILTERS,
      includeIngredients: ['Garlic'],
    })
  })

  it('displays selected chips and allows removing them', () => {
    const filtersWithSelections: RecipeFilterState = {
      ...DEFAULT_RECIPE_FILTERS,
      dietaryTags: ['Vegan'],
      tags: ['Italian'],
      includeIngredients: ['Tomato'],
      excludeIngredients: ['Peanuts'],
    }

    render(
      <RecipeFilterDrawer
        {...defaultProps}
        filters={filtersWithSelections}
      />
    )

    // Remove Vegan chip
    const removeVegan = screen.getByRole('button', { name: /Remove Vegan/i })
    fireEvent.click(removeVegan)
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...filtersWithSelections,
      dietaryTags: [],
    })

    // Remove Italian chip
    const removeItalian = screen.getByRole('button', { name: /Remove Italian/i })
    fireEvent.click(removeItalian)
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...filtersWithSelections,
      tags: [],
    })
  })

  it('calls onClearFilters when clicking Reset all', () => {
    const filtersWithSelections: RecipeFilterState = {
      ...DEFAULT_RECIPE_FILTERS,
      dietaryTags: ['Vegan'],
    }
    render(
      <RecipeFilterDrawer
        {...defaultProps}
        filters={filtersWithSelections}
      />
    )

    const resetButton = screen.getByRole('button', { name: /Reset all/i })
    fireEvent.click(resetButton)
    expect(defaultProps.onClearFilters).toHaveBeenCalled()
  })

  it('closes modal when clicking Apply / Show Recipes button', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)
    const applyButton = screen.getByRole('button', { name: 'Show 5 Recipes' })
    fireEvent.click(applyButton)
    expect(defaultProps.onToggleOpen).toHaveBeenCalled()
  })

  it('disables apply button when matchingCount is 0', () => {
    render(<RecipeFilterDrawer {...defaultProps} matchingCount={0} />)
    const zeroButton = screen.getByRole('button', { name: '0 Recipes Match' })
    expect(zeroButton).toBeDisabled()
  })
})

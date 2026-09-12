import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecipeFilterDrawer } from './RecipeFilterDrawer'
import { DEFAULT_RECIPE_FILTERS, type RecipeFilterState } from '../../features/recipes/utils/recipeFiltering'
import type { Recipe } from '../../types/nutrition'

const sampleRecipes: Recipe[] = [
  {
    id: '1',
    recipeName: 'Vegan Avocado Salad',
    description: 'Fresh salad',
    tags: ['Salad', 'Healthy'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 1,
    instructions: ['Mix ingredients'],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 350 } },
    ingredients: ['1 whole Avocado', '2 cups Spinach'],
  },
  {
    id: '2',
    recipeName: 'Lentil Soup',
    description: 'Warm soup',
    tags: ['Soup'],
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    servings: 4,
    instructions: ['Boil lentils'],
    source: 'manual',
    nutritionalInfo: { perServing: { calories: 550 } },
    ingredients: ['1 cup Lentils', '2 cloves Garlic'],
  },
]

describe('RecipeFilterDrawer', () => {
  let defaultProps: any

  beforeEach(() => {
    defaultProps = {
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
  })

  it('renders dialog with separated Dietary Requirements and Recipe Tags sections', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Filter Recipes')).toBeInTheDocument()
    expect(screen.getByText('Dietary Requirements')).toBeInTheDocument()
    expect(screen.getByText('Recipe Tags')).toBeInTheDocument()
    expect(screen.getByText('Show 5 Recipes')).toBeInTheDocument()
  })

  it('keeps draft state and commits only when clicking Show/Apply button', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)

    // Select Vegetarian via quick pill
    const vegButton = screen.getByRole('button', { name: /\+ Vegetarian/i })
    fireEvent.click(vegButton)

    // onFiltersChange must NOT be called yet
    expect(defaultProps.onFiltersChange).not.toHaveBeenCalled()

    // Select prep time < 30m
    const time30Button = screen.getByRole('button', { name: '< 30m' })
    fireEvent.click(time30Button)

    // Select max calories < 600
    const cal600Button = screen.getByRole('button', { name: '< 600' })
    fireEvent.click(cal600Button)

    // Add include ingredient
    const input = screen.getByPlaceholderText(/e\.g\. Garlic, Tomato\.\.\./i)
    fireEvent.change(input, { target: { value: 'Garlic' } })
    const addButton = screen.getByRole('button', { name: 'Add' })
    fireEvent.click(addButton)

    expect(defaultProps.onFiltersChange).not.toHaveBeenCalled()

    // Click Apply / Show 5 Recipes button
    const applyButton = screen.getByRole('button', { name: 'Show 5 Recipes' })
    fireEvent.click(applyButton)

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_RECIPE_FILTERS,
      dietaryTags: ['Vegetarian'],
      maxPrepTime: 30,
      maxCalories: 600,
      includeIngredients: ['Garlic'],
    })
    expect(defaultProps.onToggleOpen).toHaveBeenCalled()
  })

  it('discards uncommitted edits when Cancel button is clicked', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)

    const vegButton = screen.getByRole('button', { name: /\+ Vegetarian/i })
    fireEvent.click(vegButton)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    expect(defaultProps.onFiltersChange).not.toHaveBeenCalled()
    expect(defaultProps.onToggleOpen).toHaveBeenCalled()
  })

  it('discards uncommitted edits when Escape key is pressed', () => {
    render(<RecipeFilterDrawer {...defaultProps} />)

    const vegButton = screen.getByRole('button', { name: /\+ Vegetarian/i })
    fireEvent.click(vegButton)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(defaultProps.onFiltersChange).not.toHaveBeenCalled()
    expect(defaultProps.onToggleOpen).toHaveBeenCalled()
  })

  it('calculates live matching count from allRecipes dynamically against draft filters', () => {
    render(
      <RecipeFilterDrawer
        {...defaultProps}
        allRecipes={sampleRecipes}
        filters={DEFAULT_RECIPE_FILTERS}
      />
    )

    // Initially both recipes match
    expect(screen.getByText('Show 2 Recipes')).toBeInTheDocument()

    // Add garlic to include ingredients -> only Lentil Soup has garlic
    const input = screen.getByPlaceholderText(/e\.g\. Garlic, Tomato\.\.\./i)
    fireEvent.change(input, { target: { value: 'Garlic' } })
    const addButton = screen.getByRole('button', { name: 'Add' })
    fireEvent.click(addButton)

    // Live count updates immediately in draft before committing!
    expect(screen.getByText('Show 1 Recipe')).toBeInTheDocument()
  })

  it('allows removing chips in draft and committing', () => {
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

    // Remove Italian chip
    const removeItalian = screen.getByRole('button', { name: /Remove Italian/i })
    fireEvent.click(removeItalian)

    // Commit changes
    const applyButton = screen.getByRole('button', { name: 'Show 5 Recipes' })
    fireEvent.click(applyButton)

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...filtersWithSelections,
      dietaryTags: [],
      tags: [],
    })
  })

  it('resets draft filters when clicking Reset all inside the dialog', () => {
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

    const resetButton = screen.getByRole('button', { name: /Reset all \(1\)/i })
    fireEvent.click(resetButton)

    // Chip should be removed in draft
    expect(screen.queryByText('Vegan')).not.toBeInTheDocument()
    expect(screen.getByText('No filters currently applied')).toBeInTheDocument()

    // Commit reset
    const applyButton = screen.getByRole('button', { name: 'Show 5 Recipes' })
    fireEvent.click(applyButton)

    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(DEFAULT_RECIPE_FILTERS)
  })

  it('calls onClearFilters when clicking external Clear all filters button', () => {
    const filtersWithSelections: RecipeFilterState = {
      ...DEFAULT_RECIPE_FILTERS,
      dietaryTags: ['Vegan'],
    }
    render(
      <RecipeFilterDrawer
        {...defaultProps}
        isOpen={false}
        hideHeaderButton={false}
        filters={filtersWithSelections}
      />
    )

    const clearButton = screen.getByRole('button', { name: /Clear all filters/i })
    fireEvent.click(clearButton)
    expect(defaultProps.onClearFilters).toHaveBeenCalled()
  })

  it('disables apply button when matchingCount is 0', () => {
    render(<RecipeFilterDrawer {...defaultProps} matchingCount={0} />)
    const zeroButton = screen.getByRole('button', { name: '0 Recipes Match' })
    expect(zeroButton).toBeDisabled()
  })

  it('traps Tab focus inside the modal and restores focus on close', async () => {
    const triggerButton = document.createElement('button')
    triggerButton.textContent = 'Open Filters'
    document.body.appendChild(triggerButton)
    triggerButton.focus()

    const { rerender } = render(<RecipeFilterDrawer {...defaultProps} isOpen={true} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()

    // Tab trap
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    expect(focusables.length).toBeGreaterThan(1)

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    // Focus last element and press Tab -> should wrap to first
    last.focus()
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    // Focus first element and press Shift+Tab -> should wrap to last
    first.focus()
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)

    // Close modal -> should restore focus to trigger button
    rerender(<RecipeFilterDrawer {...defaultProps} isOpen={false} />)

    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton)
    })

    document.body.removeChild(triggerButton)
  })
})

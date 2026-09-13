import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrintableRecipeCard } from '../PrintableRecipeCard'
import type { Recipe } from '../../../../types/nutrition'

const mockRecipe: Recipe = {
  id: 'recipe-1',
  recipeName: 'Classic Margherita Pizza',
  description: 'Crispy thin crust topped with fresh mozzarella and basil.',
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  servings: 4,
  imageUrl: 'https://example.com/pizza.jpg',
  ingredients: [
    '500 g pizza flour',
    '300 ml warm water',
    '7 g active dry yeast',
    '200 g fresh mozzarella',
    'fresh basil leaves',
  ],
  instructions: [
    'Mix flour, yeast, and warm water in a large bowl.',
    'Knead dough for 10 minutes until smooth and elastic.',
    'Let rise for 60 minutes in a warm place.',
    'Bake at 250C for 12 minutes until crust is golden brown.',
  ],
  tags: ['italian', 'pizza', 'dinner'],
  dietaryRestrictions: ['vegetarian'],
  nutritionalInfo: {
    perServing: {
      calories: 420,
      protein: 18,
      carbohydrates: 54,
      fat: 14,
      fiber: 3,
      sodium: 680,
    },
  },
  tips: {
    substitutions: ['Use gluten-free 1-to-1 baking flour if needed.'],
    storage: 'Store leftover slices in an airtight container for up to 3 days.',
    makeAhead: 'Dough can be cold-fermented in the refrigerator for up to 48 hours.',
    reheating: 'Reheat slices in a hot skillet for 2-3 minutes for a crispy bottom.',
  },
  source: 'user',
}

describe('PrintableRecipeCard', () => {
  it('renders essential recipe details, title, and brand header', () => {
    render(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        authorName="Chef Maria"
        rating={4.8}
        ratingCount={24}
      />
    )

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument()
    expect(screen.getByText(/CookFlow • Recipe Collection/i)).toBeInTheDocument()
    expect(screen.getByText(/By Chef Maria/i)).toBeInTheDocument()
    expect(screen.getByText(/4.8/i)).toBeInTheDocument()
    expect(screen.getByText(/24 reviews/i)).toBeInTheDocument()
  })

  it('renders ingredient checklist with prep checkboxes and scales quantities', () => {
    render(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={8} // Scaled 2x
      />
    )

    expect(screen.getByText(/Ingredients/i)).toBeInTheDocument()
    expect(screen.getAllByText(/8 servings/i).length).toBeGreaterThanOrEqual(1)
    // 500 g flour scaled 2x -> 1000 g flour
    expect(screen.getByText(/1000 g pizza flour/i)).toBeInTheDocument()
    // 300 ml water scaled 2x -> 600 ml warm water
    expect(screen.getByText(/600 ml warm water/i)).toBeInTheDocument()
  })

  it('renders numbered instruction steps with timers', () => {
    render(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
      />
    )

    expect(screen.getByText(/Instructions/i)).toBeInTheDocument()
    expect(screen.getByText(/Mix flour, yeast, and warm water/i)).toBeInTheDocument()
    expect(screen.getByText(/Knead dough for 10 minutes/i)).toBeInTheDocument()
  })

  it('conditionally renders photo based on includePhoto prop', () => {
    const { rerender } = render(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        includePhoto={false}
      />
    )
    expect(screen.queryByAltText('Classic Margherita Pizza')).not.toBeInTheDocument()

    rerender(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        includePhoto={true}
      />
    )
    expect(screen.getByAltText('Classic Margherita Pizza')).toBeInTheDocument()
  })

  it('renders nutrition facts summary when includeNutrition is true', () => {
    const { rerender } = render(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        includeNutrition={false}
      />
    )
    expect(screen.queryByText(/Nutrition per serving/i)).not.toBeInTheDocument()

    rerender(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        includeNutrition={true}
      />
    )
    expect(screen.getByText(/Nutrition per serving/i)).toBeInTheDocument()
    expect(screen.getByText(/420/)).toBeInTheDocument() // calories
    expect(screen.getByText(/18g/)).toBeInTheDocument() // protein
  })

  it('renders tips and storage recommendations when includeTips is true', () => {
    const { rerender } = render(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        includeTips={false}
      />
    )
    expect(screen.queryByText(/Chef's Tips & Storage/i)).not.toBeInTheDocument()

    rerender(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        includeTips={true}
      />
    )
    expect(screen.getByText(/Chef's Tips & Storage/i)).toBeInTheDocument()
    expect(screen.getByText(/Use gluten-free 1-to-1 baking flour/i)).toBeInTheDocument()
  })

  it('renders handwritten kitchen notes area when includeNotesArea is true', () => {
    const { rerender } = render(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        includeNotesArea={false}
      />
    )
    expect(screen.queryByText(/Cook's Notes & Modifications/i)).not.toBeInTheDocument()

    rerender(
      <PrintableRecipeCard
        recipe={mockRecipe}
        servings={4}
        includeNotesArea={true}
      />
    )
    expect(screen.getByText(/Cook's Notes & Modifications/i)).toBeInTheDocument()
  })
})

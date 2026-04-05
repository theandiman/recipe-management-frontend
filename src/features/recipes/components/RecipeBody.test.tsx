import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecipeBody from './RecipeBody'
import type { Recipe } from '../../../types/nutrition'

const baseRecipe: Recipe = {
  id: 'r1',
  recipeName: 'Test Recipe',
  description: 'A tasty test dish',
  ingredients: ['1 cup flour', '2 eggs'],
  instructions: ['Mix ingredients', 'Bake for 30 minutes'],
  prepTimeMinutes: 10,
  cookTimeMinutes: 30,
  servings: 4,
  tags: ['Healthy', 'Quick'],
  updatedAt: new Date(),
  source: 'ai',
}

describe('RecipeBody', () => {
  it('renders description', () => {
    render(<RecipeBody recipe={baseRecipe} />)
    expect(screen.getByText('A tasty test dish')).toBeInTheDocument()
  })

  it('renders prep and cook time', () => {
    render(<RecipeBody recipe={baseRecipe} />)
    expect(screen.getByText('Prep Time')).toBeInTheDocument()
    expect(screen.getByText('10 min')).toBeInTheDocument()
    expect(screen.getByText('Cook Time')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('renders servings', () => {
    render(<RecipeBody recipe={baseRecipe} />)
    expect(screen.getByText('Servings')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders ingredients', () => {
    render(<RecipeBody recipe={baseRecipe} />)
    expect(screen.getByText('Ingredients')).toBeInTheDocument()
    expect(screen.getByText('1 cup flour')).toBeInTheDocument()
    expect(screen.getByText('2 eggs')).toBeInTheDocument()
  })

  it('renders instructions', () => {
    render(<RecipeBody recipe={baseRecipe} />)
    expect(screen.getByText('Instructions')).toBeInTheDocument()
    expect(screen.getByText('Mix ingredients')).toBeInTheDocument()
    expect(screen.getByText('Bake for 30 minutes')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<RecipeBody recipe={baseRecipe} />)
    expect(screen.getByText('Healthy')).toBeInTheDocument()
    expect(screen.getByText('Quick')).toBeInTheDocument()
  })

  it('renders NutritionFacts when nutritionalInfo.perServing is present', () => {
    const recipe: Recipe = {
      ...baseRecipe,
      nutritionalInfo: {
        perServing: { calories: 350, protein: 12, carbohydrates: 45, fat: 10 },
      },
    }
    render(<RecipeBody recipe={recipe} />)
    expect(screen.getByText(/350/)).toBeInTheDocument()
  })

  it('does NOT render NutritionFacts when nutritionalInfo is absent', () => {
    const recipe: Recipe = { ...baseRecipe, nutritionalInfo: undefined }
    render(<RecipeBody recipe={recipe} />)
    expect(screen.queryByText(/Nutrition/i)).not.toBeInTheDocument()
  })

  it('renders tips sections when present', () => {
    const recipe: Recipe = {
      ...baseRecipe,
      tips: {
        substitutions: ['Use oat flour instead of wheat flour'],
        variations: ['Add chocolate chips'],
        storage: 'Store in an airtight container',
        makeAhead: 'Can be prepared a day ahead',
        reheating: 'Warm in oven at 180°C',
      },
    }
    render(<RecipeBody recipe={recipe} />)
    expect(screen.getByText(/Tips & Tricks/i)).toBeInTheDocument()
    expect(screen.getByText('Use oat flour instead of wheat flour')).toBeInTheDocument()
    expect(screen.getByText('Add chocolate chips')).toBeInTheDocument()
    expect(screen.getByText('Store in an airtight container')).toBeInTheDocument()
    expect(screen.getByText('Can be prepared a day ahead')).toBeInTheDocument()
    expect(screen.getByText('Warm in oven at 180°C')).toBeInTheDocument()
  })

  it('does NOT render tips when absent', () => {
    const recipe: Recipe = { ...baseRecipe, tips: undefined }
    render(<RecipeBody recipe={recipe} />)
    expect(screen.queryByText(/Tips & Tricks/i)).not.toBeInTheDocument()
  })

  it('renders dietary restrictions when present', () => {
    const recipe: Recipe = {
      ...baseRecipe,
      dietaryRestrictions: ['Gluten-Free', 'Vegan'],
    } as Recipe
    render(<RecipeBody recipe={recipe} />)
    expect(screen.getByText('Gluten-Free')).toBeInTheDocument()
    expect(screen.getByText('Vegan')).toBeInTheDocument()
  })
})

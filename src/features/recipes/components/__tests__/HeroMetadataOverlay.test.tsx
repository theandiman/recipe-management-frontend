import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroMetadataOverlay } from '../HeroMetadataOverlay'
import type { Recipe } from '../../../../types/nutrition'

const mockRecipe: Recipe = {
  id: 'recipe-1',
  recipeName: 'Creamy Garlic Pasta',
  source: 'MANUAL',
  prepTimeMinutes: 15,
  cookTimeMinutes: 20,
  servings: 4,
  nutritionalInfo: {
    perServing: {
      calories: 520,
      protein: 14,
      carbohydrates: 65,
      fat: 22,
    },
  },
  ingredients: ['Pasta', 'Garlic', 'Cream'],
  instructions: ['Boil pasta', 'Make sauce'],
}

describe('HeroMetadataOverlay', () => {
  it('renders prep time, cook time, servings, and calories correctly', () => {
    render(<HeroMetadataOverlay recipe={mockRecipe} />)

    expect(screen.getByText('Prep: 15m')).toBeInTheDocument()
    expect(screen.getByText('Cook: 20m')).toBeInTheDocument()
    expect(screen.getByText('4 Servings')).toBeInTheDocument()
    expect(screen.getByText('520 kcal')).toBeInTheDocument()
  })

  it('handles missing calories or timing gracefully', () => {
    const minimalRecipe: Recipe = {
      id: 'min-1',
      recipeName: 'Simple Salad',
      source: 'MANUAL',
      servings: 2,
      ingredients: ['Lettuce'],
      instructions: ['Mix'],
    }

    render(<HeroMetadataOverlay recipe={minimalRecipe} />)
    expect(screen.getByText('2 Servings')).toBeInTheDocument()
    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NutritionFacts from './NutritionFacts'
import type { NutritionalInfo } from '../types/nutrition'

describe('NutritionFacts', () => {
  it('should render nutrition facts with complete data', () => {
    const nutritionalInfo: NutritionalInfo = {
      perServing: {
        calories: 500,
        protein: 25,
        carbohydrates: 60,
        fat: 15,
        fiber: 8,
        sodium: 800
      }
    }

    render(<NutritionFacts nutritionalInfo={nutritionalInfo} />)

    // Check for energy display (should show both kJ and kcal)
    expect(screen.getByText(/2092kJ/)).toBeInTheDocument()
    expect(screen.getByText(/500kcal/)).toBeInTheDocument()

    // Check for macronutrients
    expect(screen.getByText('Energy')).toBeInTheDocument()
    expect(screen.getByText('Fat')).toBeInTheDocument()
    expect(screen.getByText('Saturates')).toBeInTheDocument()
    expect(screen.getByText('Sugars')).toBeInTheDocument()
    expect(screen.getByText('Salt')).toBeInTheDocument()
  })

  it('should return null when nutritionalInfo is missing', () => {
    const { container } = render(<NutritionFacts nutritionalInfo={{}} />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null when perServing is undefined', () => {
    const nutritionalInfo = {} as NutritionalInfo
    const { container } = render(<NutritionFacts nutritionalInfo={nutritionalInfo} />)
    expect(container.firstChild).toBeNull()
  })

  it('should handle zero values correctly', () => {
    const nutritionalInfo: NutritionalInfo = {
      perServing: {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0
      }
    }

    const { container } = render(<NutritionFacts nutritionalInfo={nutritionalInfo} />)

    // Should render with 0 values - check for the component structure
    expect(container.querySelector('.text-xl')).toBeInTheDocument()
  })

  it('should calculate percentages based on UK GDA', () => {
    const nutritionalInfo: NutritionalInfo = {
      perServing: {
        calories: 400, // 20% of 2000kcal GDA
        protein: 25,   // 50% of 50g GDA
        carbohydrates: 52, // 20% of 260g GDA
        fat: 14        // 20% of 70g GDA
      }
    }

    const { container } = render(<NutritionFacts nutritionalInfo={nutritionalInfo} />)
    
    // Should render percentage indicators
    expect(container.textContent).toContain('20%')
  })

  it('should apply traffic light colors based on nutrient levels', () => {
    const highFatNutrition: NutritionalInfo = {
      perServing: {
        calories: 500,
        fat: 20, // High fat (>17.5g) should get red color
        carbohydrates: 50,
        protein: 20
      }
    }

    const { container } = render(<NutritionFacts nutritionalInfo={highFatNutrition} />)
    
    // Should apply red background for high fat
    const redElements = container.querySelectorAll('.bg-red-500')
    expect(redElements.length).toBeGreaterThan(0)
  })
})

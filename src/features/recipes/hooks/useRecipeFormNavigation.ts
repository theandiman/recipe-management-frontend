import { useState, useCallback } from 'react'

const TOTAL_STEPS = 5

interface StepDefinition {
  number: number
  title: string
  icon: string
}

export const RECIPE_FORM_STEPS: StepDefinition[] = [
  { number: 1, title: 'Basic Info', icon: '📝' },
  { number: 2, title: 'Ingredients', icon: '🥕' },
  { number: 3, title: 'Instructions', icon: '👨‍🍳' },
  { number: 4, title: 'Additional Info', icon: '⏱️' },
  { number: 5, title: 'Review', icon: '✅' }
]

export function useRecipeFormNavigation() {
  const [currentStep, setCurrentStep] = useState(1)

  const goToNextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep])

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step)
    }
  }, [])

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === TOTAL_STEPS

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    steps: RECIPE_FORM_STEPS,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isFirstStep,
    isLastStep
  }
}

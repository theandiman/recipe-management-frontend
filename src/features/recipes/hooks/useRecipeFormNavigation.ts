import { useState, useCallback, useMemo } from 'react'

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
    setCurrentStep(prev => (prev < TOTAL_STEPS ? prev + 1 : prev))
  }, [])

  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => (prev > 1 ? prev - 1 : prev))
  }, [])

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step)
    }
  }, [])

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === TOTAL_STEPS

  return useMemo(() => ({
    currentStep,
    totalSteps: TOTAL_STEPS,
    steps: RECIPE_FORM_STEPS,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isFirstStep,
    isLastStep
  }), [currentStep, goToNextStep, goToPreviousStep, goToStep, isFirstStep, isLastStep])
}

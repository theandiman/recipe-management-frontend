import React, { useState } from 'react'
import type { RecipeResponse } from '../services/recipeStorageApi'

interface CookingModeProps {
  recipe: RecipeResponse
  onClose: () => void
}

/**
 * Step-by-step cooking mode view
 * Shows one instruction at a time with large, readable text
 * Great for following along while cooking
 */
export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [showIngredients, setShowIngredients] = useState(false)

  const totalSteps = recipe.instructions.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  const toggleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const currentInstruction = recipe.instructions[currentStep]
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header with close and recipe title */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">{recipe.title}</h2>
            <p className="text-emerald-100 text-sm mt-1">Step {currentStep + 1} of {totalSteps}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            title="Close cooking mode"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Main content area - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {showIngredients ? (
            // Ingredients panel
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Ingredients</h3>
                <button
                  onClick={() => setShowIngredients(false)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Back to Steps →
                </button>
              </div>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient: string, index: number) => (
                  <li key={index} className="flex items-start p-3 bg-emerald-50 rounded-lg">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            // Instructions panel
            <div className="p-8 flex flex-col">
              {/* Current instruction - large and readable */}
              <div className="mb-8 flex-1">
                <div className="text-6xl font-bold text-emerald-600 mb-4">{currentStep + 1}</div>
                <p className="text-3xl leading-relaxed text-gray-900 font-medium">
                  {currentInstruction}
                </p>
              </div>

              {/* View ingredients button */}
              <button
                onClick={() => setShowIngredients(true)}
                className="mb-4 w-full py-3 px-4 bg-emerald-50 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
              >
                📋 View Ingredients
              </button>

              {/* Step indicator dots */}
              <div className="flex justify-center gap-2 mb-6 overflow-x-auto py-2">
                {recipe.instructions.map((_: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full font-bold text-sm transition-all ${
                      index === currentStep
                        ? 'bg-emerald-600 text-white scale-110'
                        : completedSteps.has(index)
                        ? 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={`Go to step ${index + 1}`}
                  >
                    {completedSteps.has(index) ? '✓' : index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex gap-4 flex-shrink-0">
          <button
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            className="flex-1 py-3 px-4 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <button
            onClick={() => toggleStepComplete(currentStep)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              completedSteps.has(currentStep)
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {completedSteps.has(currentStep) ? '✓ Step Complete' : 'Mark Complete'}
          </button>

          <button
            onClick={goToNextStep}
            disabled={isLastStep}
            className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastStep ? 'Done! 🎉' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

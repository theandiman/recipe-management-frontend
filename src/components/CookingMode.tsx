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
  const [showIngredients, setShowIngredients] = useState(false)

  const totalSteps = recipe.instructions.length
  const progress = ((currentStep + 1) / totalSteps) * 100

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        
        {/* Header with close and recipe title */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 flex items-center justify-between flex-shrink-0">
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

        {/* Main content area - landscape card */}
        <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
          {showIngredients ? (
            // Ingredients panel
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Ingredients</h3>
                <button
                  onClick={() => setShowIngredients(false)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Back to Steps →
                </button>
              </div>
              <ul className="space-y-3 overflow-y-auto flex-1 pr-4">
                {recipe.ingredients.map((ingredient: string, index: number) => (
                  <li key={index} className="flex items-start p-3 bg-emerald-50 rounded-lg">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-lg text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            // Instructions panel with side navigation
            <div className="w-full flex items-center justify-between gap-8">
              {/* Previous button */}
              <button
                onClick={goToPreviousStep}
                disabled={currentStep === 0}
                className="flex-shrink-0 p-4 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous step"
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Current instruction - large card */}
              <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-12 text-center border-2 border-emerald-200">
                <div className="text-7xl font-bold text-emerald-600 mb-6">{currentStep + 1}</div>
                <p className="text-4xl leading-relaxed text-gray-900 font-medium">
                  {currentInstruction}
                </p>
              </div>

              {/* Next button */}
              <button
                onClick={goToNextStep}
                disabled={isLastStep}
                className="flex-shrink-0 p-4 text-emerald-600 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={isLastStep ? "You've completed the recipe!" : "Next step"}
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex gap-4 items-center justify-center flex-shrink-0">
          <button
            onClick={() => setShowIngredients(true)}
            className="py-3 px-6 bg-emerald-50 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
          >
            📋 View Ingredients
          </button>
        </div>
      </div>
    </div>
  )
}

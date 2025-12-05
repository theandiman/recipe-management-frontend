import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Recipe } from '../types/nutrition'

interface CookingModeProps {
  recipe: Recipe
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
        
        {/* Header with close and recipe title */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">{recipe.recipeName || recipe.title}</h2>
            <p className="text-emerald-100 text-sm mt-1">Step {currentStep + 1} of {totalSteps}</p>
          </div>
          <motion.button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            title="Close cooking mode"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
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
          <AnimatePresence mode="wait">
            {showIngredients ? (
              // Ingredients panel
              <motion.div
                key="ingredients"
                className="w-full h-full flex flex-col"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <motion.h3
                  className="text-2xl font-bold text-gray-900 mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  Ingredients
                </motion.h3>
                <motion.ul
                  className="space-y-3 overflow-y-auto flex-1 pr-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                >
                  {recipe.ingredients.map((ingredient: string, index: number) => (
                    <motion.li
                      key={index}
                      className="flex items-start p-3 bg-emerald-50 rounded-lg"
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.svg
                        className="w-5 h-5 mr-3 mt-0.5 text-emerald-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </motion.svg>
                      <span className="text-lg text-gray-700">{ingredient}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            ) : (
              // Instructions panel with side navigation
              <motion.div
                key="instructions"
                className="w-full flex items-center justify-between gap-8"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
              {/* Previous button */}
              <motion.button
                onClick={goToPreviousStep}
                disabled={currentStep === 0}
                className="flex-shrink-0 p-4 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous step"
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>

              {/* Current instruction - large card */}
              <motion.div
                key={currentStep}
                className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-12 text-center border-2 border-emerald-200 flex flex-col items-center justify-center overflow-hidden"
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <motion.div
                  className="text-5xl font-light text-emerald-300 mb-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {currentStep + 1}
                </motion.div>
                <motion.p
                  className="text-3xl leading-relaxed text-gray-900 font-medium overflow-y-auto max-h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {currentInstruction}
                </motion.p>
              </motion.div>

              {/* Next button */}
              <motion.button
                onClick={goToNextStep}
                disabled={isLastStep}
                className="flex-shrink-0 p-4 text-emerald-600 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={isLastStep ? "You've completed the recipe!" : "Next step"}
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex gap-4 items-center justify-center flex-shrink-0">
          <motion.button
            onClick={() => setShowIngredients(!showIngredients)}
            className="py-3 px-6 bg-emerald-50 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {showIngredients ? (
                <motion.div
                  key="steps-icon"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Steps
                </motion.div>
              ) : (
                <motion.div
                  key="ingredients-icon"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Ingredients
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

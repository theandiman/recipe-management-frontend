import React from 'react'
import { StepIndicator } from './StepIndicator'
import { RecipeFormSteps } from './RecipeFormSteps'
import { RecipePreview } from './RecipePreview'
import type { Ingredient } from '../../../types/nutrition'

interface RecipeFormLayoutProps {
  // Mode
  mode: 'create' | 'edit'
  
  // Navigation
  currentStep: number
  totalSteps: number
  steps: { number: number; title: string; icon: string }[]
  goToStep: (step: number) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  stepsWithErrors: Set<number>
  
  // Form state
  title: string
  setTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  prepTime: string
  setPrepTime: (value: string) => void
  cookTime: string
  setCookTime: (value: string) => void
  servings: string
  setServings: (value: string) => void
  imagePreview: string | null
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: () => void
  ingredients: Ingredient[]
  addIngredient: () => void
  updateIngredient: (index: number, field: keyof Ingredient, value: string) => void
  removeIngredient: (index: number) => void
  instructions: string[]
  addInstruction: () => void
  updateInstruction: (index: number, value: string) => void
  removeInstruction: (index: number) => void
  tags: string[]
  tagInput: string
  setTagInput: (value: string) => void
  addTag: () => void
  removeTag: (index: number) => void
  fieldErrors: Record<string, string>
  clearFieldError: (fieldName: string, stepNumber: number) => void
  
  // Save state
  saveLoading: boolean
  saveError: string | null
  setSaveError: (error: string | null) => void
  
  // Handlers
  handleSubmit: (e?: React.FormEvent) => void
  handleCancel: () => void
}

export const RecipeFormLayout: React.FC<RecipeFormLayoutProps> = ({
  mode,
  currentStep,
  totalSteps,
  steps,
  goToStep,
  goToNextStep,
  goToPreviousStep,
  canGoNext,
  canGoPrevious,
  stepsWithErrors,
  title,
  setTitle,
  description,
  setDescription,
  prepTime,
  setPrepTime,
  cookTime,
  setCookTime,
  servings,
  setServings,
  imagePreview,
  handleImageUpload,
  removeImage,
  ingredients,
  addIngredient,
  updateIngredient,
  removeIngredient,
  instructions,
  addInstruction,
  updateInstruction,
  removeInstruction,
  tags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  fieldErrors,
  clearFieldError,
  saveLoading,
  saveError,
  setSaveError,
  handleSubmit,
  handleCancel
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with Step Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {mode === 'create' ? 'Create Recipe' : 'Edit Recipe'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}
            </p>
          </div>
        </div>

        {/* Step Progress Indicator - Horizontal scroll on mobile */}
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
          stepsWithErrors={stepsWithErrors}
        />
      </div>

      {/* Preview Step */}
      {currentStep === 5 ? (
        <RecipePreview
          saveError={saveError}
          setSaveError={setSaveError}
          title={title}
          description={description}
          imagePreview={imagePreview}
          prepTime={prepTime}
          cookTime={cookTime}
          servings={servings}
          ingredients={ingredients}
          instructions={instructions}
          tags={tags}
          prevStep={goToPreviousStep}
          handleCancel={handleCancel}
          handleSubmit={handleSubmit}
          saveLoading={saveLoading}
        />
      ) : (
        <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div>
            <RecipeFormSteps
                currentStep={currentStep}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                prepTime={prepTime}
                setPrepTime={setPrepTime}
                cookTime={cookTime}
                setCookTime={setCookTime}
                servings={servings}
                setServings={setServings}
                imagePreview={imagePreview}
                handleImageUpload={handleImageUpload}
                removeImage={removeImage}
                ingredients={ingredients}
                addIngredient={addIngredient}
                updateIngredient={updateIngredient}
                removeIngredient={removeIngredient}
                instructions={instructions}
                addInstruction={addInstruction}
                updateInstruction={updateInstruction}
                removeInstruction={removeInstruction}
                tags={tags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                addTag={addTag}
                removeTag={removeTag}
                fieldErrors={fieldErrors}
                clearFieldError={clearFieldError}
              />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={!canGoPrevious}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                !canGoPrevious
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Back
            </button>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={goToNextStep}
                disabled={!canGoNext}
                className={`px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors ${
                  !canGoNext ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

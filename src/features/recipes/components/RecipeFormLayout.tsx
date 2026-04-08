import React, { useEffect, useRef } from 'react'
import { StepIndicator } from './StepIndicator'
import { RecipeFormSteps } from './RecipeFormSteps'
import { RecipePreview } from './RecipePreview'
import { AISuggestionPanel } from './AISuggestionPanel'
import { useAISuggestions } from '../hooks/useAISuggestions'
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
  dietaryRestrictions: string[]
  dietaryInput: string
  setDietaryInput: (value: string) => void
  addDietaryRestriction: () => void
  removeDietaryRestriction: (index: number) => void
  fieldErrors: Record<string, string>
  clearFieldError: (fieldName: string, stepNumber: number) => void
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setStepsWithErrors: React.Dispatch<React.SetStateAction<Set<number>>>
  
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
  dietaryRestrictions,
  dietaryInput,
  setDietaryInput,
  addDietaryRestriction,
  removeDietaryRestriction,
  fieldErrors,
  clearFieldError,
  setFieldErrors,
  setStepsWithErrors,
  saveLoading,
  saveError,
  setSaveError,
  handleSubmit,
  handleCancel
}) => {
  const handlePreviousStepClick = () => {
    if (saveError) {
      setSaveError(null)
    }
    goToPreviousStep()
  }

  const validateStep = (step: number): boolean => {
    let isValid = true
    if (step === 1 && !title.trim()) {
      setFieldErrors(prev => ({ ...prev, title: 'Recipe name is required' }))
      setStepsWithErrors(prev => new Set([...prev, 1]))
      isValid = false
    }
    if (step === 2 && !ingredients.some(i => i.item.trim())) {
      setFieldErrors(prev => ({ ...prev, ingredients: 'At least one ingredient is required' }))
      setStepsWithErrors(prev => new Set([...prev, 2]))
      isValid = false
    }
    if (step === 3 && !instructions.some(i => i.trim())) {
      setFieldErrors(prev => ({ ...prev, instructions: 'At least one instruction is required' }))
      setStepsWithErrors(prev => new Set([...prev, 3]))
      isValid = false
    }
    if (step === 4) {
      if (prepTime && Number(prepTime) > 999) {
        setFieldErrors(prev => ({ ...prev, prepTime: 'Prep time must be under 1000 minutes' }))
        setStepsWithErrors(prev => new Set([...prev, 4]))
        isValid = false
      }
      if (cookTime && Number(cookTime) > 999) {
        setFieldErrors(prev => ({ ...prev, cookTime: 'Cook time must be under 1000 minutes' }))
        setStepsWithErrors(prev => new Set([...prev, 4]))
        isValid = false
      }
      if (servings && Number(servings) > 99) {
        setFieldErrors(prev => ({ ...prev, servings: 'Servings must be under 100' }))
        setStepsWithErrors(prev => new Set([...prev, 4]))
        isValid = false
      }
    }
    return isValid
  }

  const handleNextStepClick = () => {
    if (validateStep(currentStep)) {
      goToNextStep()
    }
  }

  const handleStepIndicatorClick = (targetStep: number) => {
    // Only validate if moving forward
    if (targetStep > currentStep) {
      // Validate ALL steps from current up to the target so all error indicators are set
      let firstErrorStep: number | null = null
      for (let i = currentStep; i < targetStep; i++) {
        const stepValid = validateStep(i)
        if (!stepValid && firstErrorStep === null) {
          firstErrorStep = i
        }
      }
      if (firstErrorStep !== null) {
        // Navigate to the first failing step so the user can see and fix the error.
        // If the failing step IS the current step, stay on it.
        if (firstErrorStep !== currentStep) {
          goToStep(firstErrorStep)
        }
        return
      }
    }
    goToStep(targetStep)
  }

  // AI suggestion integration
  const {
    visibleSuggestions,
    status: suggestionStatus,
    error: suggestionError,
    fetchSuggestions,
    applySuggestion,
    dismissSuggestion,
  } = useAISuggestions()

  // Fetch suggestions once when the recipe title is available (first meaningful state)
  const suggestionFetched = useRef(false)
  useEffect(() => {
    if (!suggestionFetched.current && title.trim().length > 2) {
      suggestionFetched.current = true
      fetchSuggestions({
        recipeName: title || undefined,
        description: description || undefined,
        prepTime: prepTime || undefined,
        cookTime: cookTime || undefined,
        servings: servings || undefined,
        tags: tags.length > 0 ? tags : undefined,
        ingredients: ingredients.filter(i => i.item.trim()).map(i =>
          [i.quantity, i.unit, i.item].filter(Boolean).join(' ')
        ),
        instructions: instructions.filter(i => i.trim()),
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  const fieldSetters: Partial<Record<string, (value: string) => void>> = {
    recipeName: setTitle,
    description: setDescription,
    prepTime: setPrepTime,
    cookTime: setCookTime,
    servings: setServings,
  }

  const handleRetrySuggestions = () => {
    suggestionFetched.current = false
    fetchSuggestions({
      recipeName: title || undefined,
      description: description || undefined,
      prepTime: prepTime || undefined,
      cookTime: cookTime || undefined,
      servings: servings || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
  }

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
          onStepClick={handleStepIndicatorClick}
          stepsWithErrors={stepsWithErrors}
        />
      </div>

      {/* AI Suggestion Panel — shown on non-preview steps */}
      {currentStep !== 5 && (
        <AISuggestionPanel
          suggestions={visibleSuggestions}
          status={suggestionStatus}
          error={suggestionError}
          onApply={applySuggestion}
          onDismiss={dismissSuggestion}
          fieldSetters={fieldSetters}
          onRetry={handleRetrySuggestions}
        />
      )}

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
          prevStep={handlePreviousStepClick}
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
                dietaryRestrictions={dietaryRestrictions}
                dietaryInput={dietaryInput}
                setDietaryInput={setDietaryInput}
                addDietaryRestriction={addDietaryRestriction}
                removeDietaryRestriction={removeDietaryRestriction}
                fieldErrors={fieldErrors}
                clearFieldError={clearFieldError}
              />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePreviousStepClick}
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
                onClick={handleNextStepClick}
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

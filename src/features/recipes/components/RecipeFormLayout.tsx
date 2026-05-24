import React, { useCallback, useMemo } from 'react'
import { StepIndicator } from './StepIndicator'
import { RecipeFormSteps } from './RecipeFormSteps'
import { AISpinnerIcon } from './AISpinnerIcon'


import { RecipePreview } from './RecipePreview'
import { AISuggestionPanel } from './AISuggestionPanel'
import { useAISuggestions } from '../hooks/useAISuggestions'
import { useInstructionRefinement } from '../hooks/useInstructionRefinement'
import { useAIImageGeneration } from '../hooks/useAIImageGeneration'
import { FIELD_LABELS } from '../constants/aiConstants'
import { AIUndoButton } from './AIUndoButton'
import { AIBadge } from './AIBadge'
import { mapEstimateToNutritionalInfo, useNutritionEstimate } from '../hooks/useNutritionEstimate'
import { NutritionEstimatePanel } from './NutritionEstimatePanel'
import { AI_BUTTON_CLASS } from './aiStyles'
import {
  normalizeSuggestionListValue,
  parseSuggestedList,
  stringifySuggestionList,
} from '../utils/aiSuggestionValueUtils'
import type { Ingredient, Recipe } from '../../../types/nutrition'
import NutritionFacts from '../../../components/NutritionFacts'
import { UI_STYLES } from '../../../utils/uiStyles'

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
  setImagePreview?: (value: string | null) => void
  ingredients: Ingredient[]
  addIngredient: () => void
  updateIngredient: (index: number, field: keyof Ingredient, value: string) => void
  removeIngredient: (index: number) => void
  instructions: string[]
  addInstruction: () => void
  updateInstruction: (index: number, value: string) => void
  removeInstruction: (index: number) => void
  tags: string[]
  setTags: (value: string[]) => void
  tagInput: string
  setTagInput: (value: string) => void
  addTag: () => void
  removeTag: (index: number) => void
  dietaryRestrictions: string[]
  setDietaryRestrictions: (value: string[]) => void
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

  // AI Audit Trail (optional — only present when AI suggestions are enabled)
  canUndoAI?: boolean
  onUndoLastAI?: () => void
  lastUndoableAIField?: string | null
  nutritionalInfo?: Recipe['nutritionalInfo']
  onNutritionalInfoChange?: (nutritionalInfo: Recipe['nutritionalInfo'] | undefined) => void
  normalizationStates?: Map<number, import('../hooks/useIngredientNormalization').NormalizationState>
  onApplyNormalization?: (index: number) => void
  onDismissNormalization?: (index: number) => void
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
  setImagePreview,
  ingredients,
  addIngredient,
  updateIngredient,
  removeIngredient,
  instructions,
  addInstruction,
  updateInstruction,
  removeInstruction,
  tags,
  setTags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  dietaryRestrictions,
  setDietaryRestrictions,
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
  handleCancel,
  canUndoAI = false,
  onUndoLastAI,
  lastUndoableAIField,
  nutritionalInfo,
  onNutritionalInfoChange,
  normalizationStates,
  onApplyNormalization,
  onDismissNormalization,
}) => {
  // --- AI Instruction Refinement Hook ---
  const {
    stepStates: instructionRefinementStates,
    loadingState: instructionRefinementLoading,
    refineSingle: refineSingleInstruction,
    refineAll: refineAllInstructions,
    acceptStep: acceptInstructionRefinement,
    rejectStep: rejectInstructionRefinement,
  } = useInstructionRefinement(updateInstruction)

  // --- AI Image Generation Hook ---
  const { status: aiImageStatus, error: aiImageError, generateImage } = useAIImageGeneration()

  const handleGenerateAIImage = useCallback(
    async (recipeName: string, description?: string) => {
      const url = await generateImage(recipeName, description)
      if (url && setImagePreview) setImagePreview(url)
    },
    [generateImage, setImagePreview]
  )

  const handleRefineInstruction = useCallback(
    (index: number, instruction: string) => {
      refineSingleInstruction(index, instruction, title || undefined)
    },
    [refineSingleInstruction, title]
  )

  const handleRefineAllInstructions = useCallback(() => {
    refineAllInstructions(instructions, title || undefined)
  }, [refineAllInstructions, instructions, title])
  // --- Nutrition Estimate Hook ---
  const {
    estimate: nutritionEstimate,
    loadingState: nutritionLoadingState,
    error: nutritionError,
    estimateNutrition,
    clearEstimate: clearNutritionEstimate,
    acceptEstimate: acceptNutritionEstimate,
  } = useNutritionEstimate()

  const hasIngredients = ingredients.some((i) => i.item.trim())
  const hasSavedNutrition = Boolean(nutritionalInfo?.perServing)

  const handleAcceptNutritionEstimate = useCallback(() => {
    if (!onNutritionalInfoChange) return

    acceptNutritionEstimate((estimate) => {
      onNutritionalInfoChange(mapEstimateToNutritionalInfo(estimate))
    })
  }, [acceptNutritionEstimate, onNutritionalInfoChange])


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
    fetchFieldSuggestion,
    fieldStatus,
    applySuggestion,
    dismissSuggestion,
    canUndo: localCanUndo,
    undoLastAIChange: localUndoLastAIChange,
    auditLog: localAuditLog,
  } = useAISuggestions()

  // Derive the last undoable AI field from the most recent accepted entry.
  // After an undo the latest entry may no longer be 'accepted', so returning
  // the field only for the last entry when it is 'accepted' avoids stale labels.
  const localLastUndoableAIField = useMemo<string | null>(() => {
    const latestEntry = localAuditLog[localAuditLog.length - 1]
    return latestEntry?.event === 'accepted' ? latestEntry.field : null
  }, [localAuditLog])

  // Effective undo state: prefer local audit trail; fall back to parent-supplied props
  const effectiveCanUndo = localCanUndo || canUndoAI
  const effectiveUndoField = localLastUndoableAIField ?? lastUndoableAIField ?? null

  // Wrap setters to allow passing previousValue for audit trail
  const fieldSetters: Partial<Record<string, (value: string) => void>> = useMemo(() => ({
    recipeName: setTitle,
    description: setDescription,
    prepTime: setPrepTime,
    cookTime: setCookTime,
    servings: setServings,
    tags: (value: string) => setTags(parseSuggestedList(value)),
    dietaryRestrictions: (value: string) => setDietaryRestrictions(parseSuggestedList(value)),
  }), [setTitle, setDescription, setPrepTime, setCookTime, setServings, setTags, setDietaryRestrictions])

  // Internal undo handler: uses the local audit trail (from RecipeFormLayout's own hook)
  const handleLocalUndo = useCallback(() => {
    const result = localUndoLastAIChange()
    if (!result) return
    if (result.field === 'tags') {
      setTags(normalizeSuggestionListValue(result.previousValue))
      if (onUndoLastAI) onUndoLastAI()
      return
    }
    if (result.field === 'dietaryRestrictions') {
      setDietaryRestrictions(normalizeSuggestionListValue(result.previousValue))
      if (onUndoLastAI) onUndoLastAI()
      return
    }
    const setterMap: Record<string, (v: string) => void> = {
      recipeName: setTitle,
      description: setDescription,
      prepTime: setPrepTime,
      cookTime: setCookTime,
      servings: setServings,
    }
    const setter = setterMap[result.field]
    if (setter) setter(String(result.previousValue ?? ''))
    // Also invoke the parent's undo handler if provided (for synchronisation)
    if (onUndoLastAI) onUndoLastAI()
  }, [localUndoLastAIChange, setTitle, setDescription, setPrepTime, setCookTime, setServings, setTags, setDietaryRestrictions, onUndoLastAI])

  const handleEnhanceField = useCallback((field: string, currentValue: string) => {
    fetchFieldSuggestion(field as import('../hooks/useAISuggestions').SuggestibleFieldKey, currentValue, {
      recipeName: title,
      description: description,
      tags: tags.length > 0 ? tags : undefined,
      dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
      ingredients: ingredients.filter(i => i.item.trim()).map(i =>
        [i.quantity, i.unit, i.item].filter(Boolean).join(' ')
      ),
      instructions: instructions.filter(i => i.trim()),
    })
  }, [fetchFieldSuggestion, title, description, tags, dietaryRestrictions, ingredients, instructions])

  const handleApplyFieldSuggestion = useCallback((field: string, value: string) => {
    const setter = fieldSetters[field]
    const previousValue = {
      recipeName: title,
      description,
      prepTime,
      cookTime,
      servings,
      tags,
      dietaryRestrictions,
    }[field] ?? ''
    if (setter) {
      applySuggestion(field, () => setter(value), previousValue)
    }
  }, [fieldSetters, title, description, prepTime, cookTime, servings, tags, dietaryRestrictions, applySuggestion])

  // Shared request builder for AI suggestions
  const buildSuggestionRequest = () => ({
    recipeName: title || undefined,
    description: description || undefined,
    prepTime: prepTime || undefined,
    cookTime: cookTime || undefined,
    servings: servings || undefined,
    tags: tags.length > 0 ? tags : undefined,
    dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
    ingredients: ingredients.filter(i => i.item.trim()).map(i =>
      [i.quantity, i.unit, i.item].filter(Boolean).join(' ')
    ),
    instructions: instructions.filter(i => i.trim()),
  })

  const handleEnhanceWithAI = () => {
    fetchSuggestions(buildSuggestionRequest())
  }

  const handleRetrySuggestions = () => {
    fetchSuggestions(buildSuggestionRequest())
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with Step Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${UI_STYLES.heading}`}>
              {mode === 'create' ? 'Create Recipe' : 'Edit Recipe'}
            </h1>
            <p className={`text-sm sm:text-base ${UI_STYLES.mutedText}`}>
              Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}
            </p>
          </div>
          <div className="flex items-center gap-2">
              <AIUndoButton
                key={localAuditLog.length}
                lastField={effectiveCanUndo ? effectiveUndoField : null}
                onUndo={handleLocalUndo}
                fieldLabels={FIELD_LABELS}
              />
              {currentStep !== 5 && (
              <button
                type="button"
                onClick={handleEnhanceWithAI}
                disabled={suggestionStatus === 'loading'}
                className={AI_BUTTON_CLASS}
              >
                {suggestionStatus === 'loading' ? (
                  <>
                    <AISpinnerIcon />
                    AI assist...
                  </>
                ) : (
                  <>
                    <AIBadge />
                    AI assist
                  </>
                )}
              </button>
              )}
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
          currentValues={{
            recipeName: title,
            description,
            prepTime,
            cookTime,
            servings,
            tags: stringifySuggestionList(tags),
            dietaryRestrictions: stringifySuggestionList(dietaryRestrictions),
          }}
          onRetry={handleRetrySuggestions}
          currentStep={currentStep}
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
        <form className={`${UI_STYLES.surfaceCard} p-6 sm:p-8`}>
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
                recipeName={title}
                onRefineInstruction={handleRefineInstruction}
                onRefineAllInstructions={handleRefineAllInstructions}
                instructionRefinementStates={instructionRefinementStates}
                onAcceptInstructionRefinement={acceptInstructionRefinement}
                onRejectInstructionRefinement={rejectInstructionRefinement}
                instructionRefinementLoading={instructionRefinementLoading}
                normalizationStates={normalizationStates}
                onApplyNormalization={onApplyNormalization}
                onDismissNormalization={onDismissNormalization}
                onEnhanceField={handleEnhanceField}
                fieldStatus={fieldStatus}
                fieldSuggestions={visibleSuggestions}
                onApplyFieldSuggestion={handleApplyFieldSuggestion}
                onDismissFieldSuggestion={dismissSuggestion}
                onGenerateAIImage={setImagePreview ? handleGenerateAIImage : undefined}
                generatingAIImage={aiImageStatus === 'loading'}
                aiImageError={aiImageError}
              />
          </div>

          {/* Nutrition Estimate — shown on step 2 (Ingredients) */}
          {currentStep === 2 && (
            <div className="mt-4">
                <button
                  type="button"
                  disabled={!hasIngredients || nutritionLoadingState === 'loading'}
                onClick={() =>
                  estimateNutrition(ingredients, parseInt(servings, 10) || 1, title)
                }
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {nutritionLoadingState === 'loading'
                  ? 'Estimating…'
                  : hasSavedNutrition
                    ? 'Recalculate Nutrition with AI'
                    : 'Calculate Missing Nutrition with AI'}
              </button>
              <NutritionEstimatePanel
                estimate={nutritionEstimate}
                loadingState={nutritionLoadingState}
                error={nutritionError}
                onAccept={handleAcceptNutritionEstimate}
                onDismiss={clearNutritionEstimate}
              />
              {hasSavedNutrition && nutritionalInfo && (
                <div className="mt-4 space-y-3">
                  <p className={`text-sm ${UI_STYLES.mutedText}`}>
                    AI nutrition values will be saved with this recipe unless you recalculate or dismiss them.
                  </p>
                  <NutritionFacts nutritionalInfo={nutritionalInfo} />
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePreviousStepClick}
              disabled={!canGoPrevious}
              className={
                canGoPrevious
                  ? UI_STYLES.backButton
                  : 'px-6 py-3 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
            >
              ← Back
            </button>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className={UI_STYLES.secondaryButtonNeutral}
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

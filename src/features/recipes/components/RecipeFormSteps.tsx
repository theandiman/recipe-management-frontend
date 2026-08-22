import React from 'react'
import { IngredientInput } from '../../../components/IngredientInput'
import { UI_STYLES } from '../../../utils/uiStyles'
import { clampedNumericHandler } from '../../../utils/formUtils'
import type { Ingredient } from '../../../types/nutrition'
import type { StepRefinementState, RefinementLoadingState } from '../hooks/useInstructionRefinement'
import { isFieldSuggestion } from '../hooks/useAISuggestions'
import { InstructionDiffView } from './InstructionDiffView'
import { FieldAIEnhanceButton } from './FieldAIEnhanceButton'
import { FieldAISuggestionChip } from './FieldAISuggestionChip'
import type {
  FieldSuggestion,
  SuggestionStatus,
  SuggestibleFieldKey,
  SuggestibleFieldValue,
} from '../hooks/useAISuggestions'
import { AISpinnerIcon } from './AISpinnerIcon'
import { AIBadge } from './AIBadge'
import { AI_BUTTON_CLASS, AI_BUTTON_COMPACT_CLASS, AI_STEP_ACTION_BUTTON_CLASS } from './aiStyles'
import { stringifySuggestionList } from '../utils/aiSuggestionValueUtils'


interface RecipeFormStepsProps {
  currentStep: number
  // Basic Info
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
  // Ingredients
  ingredients: Ingredient[]
  addIngredient: () => void
  updateIngredient: (index: number, field: keyof Ingredient, value: string) => void
  removeIngredient: (index: number) => void
  // Instructions & Tags
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
  // Validation
  fieldErrors: Record<string, string>
  clearFieldError: (fieldName: string, stepNumber: number) => void
  // AI Instruction Refinement
  recipeName: string
  onRefineInstruction?: (index: number, instruction: string) => void
  onRefineAllInstructions?: () => void
  instructionRefinementStates?: Map<number, StepRefinementState>
  onAcceptInstructionRefinement?: (index: number) => void
  onRejectInstructionRefinement?: (index: number) => void
  instructionRefinementLoading?: RefinementLoadingState
  // Ingredient Normalization
  normalizationStates?: Map<number, import('../hooks/useIngredientNormalization').NormalizationState>
  onApplyNormalization?: (index: number) => void
  onDismissNormalization?: (index: number) => void
  // Per-field AI enhance
  onEnhanceField?: <K extends SuggestibleFieldKey>(field: K, currentValue: SuggestibleFieldValue<K>) => void
  fieldStatus?: Map<string, SuggestionStatus>
  fieldSuggestions?: FieldSuggestion[]
  onApplyFieldSuggestion?: (field: string, value: string) => void
  onDismissFieldSuggestion?: (field: string) => void
  // AI Image Generation
  onGenerateAIImage?: (recipeName: string, description?: string) => Promise<void>
  generatingAIImage?: boolean
  aiImageError?: string | null
}



export const RecipeFormSteps = React.memo<RecipeFormStepsProps>(({
  currentStep,
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
  recipeName,
  onRefineInstruction,
  onRefineAllInstructions,
  instructionRefinementStates,
  onAcceptInstructionRefinement,
  onRejectInstructionRefinement,
  instructionRefinementLoading,
  normalizationStates,
  onApplyNormalization,
  onDismissNormalization,
  onEnhanceField,
  fieldStatus,
  fieldSuggestions,
  onApplyFieldSuggestion,
  onDismissFieldSuggestion,
  onGenerateAIImage,
  generatingAIImage = false,
  aiImageError,
}) => {
  const getFieldStatus = (field: string): SuggestionStatus =>
    fieldStatus?.get(field) ?? 'idle'

  const getFieldSuggestion = (field: string): FieldSuggestion | undefined =>
    fieldSuggestions?.find(s => s.field === field && isFieldSuggestion(s))

  return (
    <div className="space-y-8">
      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className={`text-xl font-semibold pb-2 border-b border-gray-200 dark:border-slate-700 ${UI_STYLES.heading}`}>
            Basic Information
          </h2>

          {/* Recipe Name */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className={UI_STYLES.label}>
                Recipe Name <span className="text-red-500">*</span>
              </label>
              {onEnhanceField && (
                <FieldAIEnhanceButton
                  field="recipeName"
                  currentValue={title}
                  status={getFieldStatus('recipeName')}
                  onEnhance={() => onEnhanceField('recipeName', title)}
                />
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                // Clear error when user starts typing
                if (e.target.value) {
                  clearFieldError('title', 1)
                }
              }}
              required
              placeholder="e.g., Grandma's Chocolate Chip Cookies"
              aria-invalid={!!fieldErrors.title}
              aria-describedby={fieldErrors.title ? 'title-error' : undefined}
              className={fieldErrors.title ? UI_STYLES.inputError : UI_STYLES.input}
            />
            {fieldErrors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.title}
              </p>
            )}
            {onEnhanceField && (() => {
              const s = getFieldSuggestion('recipeName')
              return s ? (
                <FieldAISuggestionChip
                  field="recipeName"
                  suggestion={s.suggestedValue}
                  currentValue={title}
                  onApply={() => onApplyFieldSuggestion?.('recipeName', s.suggestedValue)}
                  onDismiss={() => onDismissFieldSuggestion?.('recipeName')}
                />
              ) : null
            })()}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className={UI_STYLES.label}>
                Description
              </label>
              {onEnhanceField && (
                <FieldAIEnhanceButton
                  field="description"
                  currentValue={description}
                  status={getFieldStatus('description')}
                  onEnhance={() => onEnhanceField('description', description)}
                />
              )}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of your recipe..."
              className={UI_STYLES.input}
            />
            {onEnhanceField && (() => {
              const s = getFieldSuggestion('description')
              return s ? (
                <FieldAISuggestionChip
                  field="description"
                  suggestion={s.suggestedValue}
                  currentValue={description}
                  onApply={() => onApplyFieldSuggestion?.('description', s.suggestedValue)}
                  onDismiss={() => onDismissFieldSuggestion?.('description')}
                />
              ) : null
            })()}
          </div>

          {/* Recipe Image Upload */}
          <div>
            <label className={`block mb-2 ${UI_STYLES.label}`}>
              Recipe Image
            </label>

            {!imagePreview ? (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, or WEBP (recommended max size: 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Recipe preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {onGenerateAIImage && (
              <>
                <button
                  type="button"
                  onClick={() => onGenerateAIImage(recipeName.trim(), description || undefined)}
                  disabled={!recipeName.trim() || generatingAIImage}
                  aria-label={imagePreview ? 'Regenerate image with AI' : 'Generate image with AI'}
                  className={`mt-3 ${AI_BUTTON_CLASS}`}
                >
                  {generatingAIImage ? (
                    <>
                      <AISpinnerIcon />
                      Generating...
                    </>
                  ) : (
                    <>
                      <AIBadge />
                      {imagePreview ? 'Regenerate image' : 'Generate image'}
                    </>
                  )}
                </button>
                {aiImageError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <span aria-hidden="true">⚠️</span> {aiImageError}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Ingredients */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <IngredientInput
            ingredients={ingredients}
            onAddIngredient={addIngredient}
            onUpdateIngredient={updateIngredient}
            onRemoveIngredient={removeIngredient}
            normalizationStates={normalizationStates}
            onApplyNormalization={onApplyNormalization}
            onDismissNormalization={onDismissNormalization}
          />
          {fieldErrors.ingredients && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/70 rounded-lg flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{fieldErrors.ingredients}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Instructions */}
      {currentStep === 3 && (
        <div className="space-y-8">
          {/* Instructions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700">
              <h2 className={`text-xl font-semibold ${UI_STYLES.heading}`}>
                Instructions <span className="text-red-500">*</span>
              </h2>
              <div className="flex gap-2">
                {onRefineAllInstructions && (
                  <button
                    type="button"
                    onClick={onRefineAllInstructions}
                    disabled={instructionRefinementLoading === 'loading' || !instructions.some(i => i.trim())}
                    aria-label="Refine all instructions with AI"
                    className={AI_BUTTON_COMPACT_CLASS}
                  >
                    {instructionRefinementLoading === 'loading' ? (
                      <AISpinnerIcon />
                    ) : (
                      <AIBadge />
                    )}
                    Refine all
                  </button>
                )}
                <button
                  type="button"
                  onClick={addInstruction}
                  className={UI_STYLES.addButton}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Step</span>
                </button>
                
              </div>
            </div>

            <div className="space-y-3">
              {instructions.map((instruction, index) => {
                const refinementState = instructionRefinementStates?.get(index)
                const isPending = refinementState?.status === 'pending'
  return (
    <div key={index} className="flex items-start space-x-3">
      <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center">
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold">
          {index + 1}
        </span>
      </span>
      <div className="flex-1">
        <textarea
          value={instruction}
          onChange={(e) => updateInstruction(index, e.target.value)}
          placeholder="Describe this step in detail..."
          required={index === 0}
          rows={2}
          className={`${UI_STYLES.input} resize-none`}
        />
        {isPending && refinementState && onAcceptInstructionRefinement && onRejectInstructionRefinement && (
          <div className="mt-2">
            <InstructionDiffView
              original={refinementState.original}
              refined={refinementState.refined}
              onAccept={() => onAcceptInstructionRefinement(index)}
              onReject={() => onRejectInstructionRefinement(index)}
              isLoading={instructionRefinementLoading === 'loading'}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {onRefineInstruction && instruction.trim() && (
          <button
            type="button"
            onClick={() => onRefineInstruction(index, instruction)}
            disabled={instructionRefinementLoading === 'loading'}
            aria-label={`Refine step ${index + 1} with AI`}
            title="Refine this step with AI"
            className={AI_STEP_ACTION_BUTTON_CLASS}
          >
            <span aria-hidden="true">AI</span>
          </button>
        )}
        {instructions.length > 1 && (
          <button
            type="button"
            onClick={() => removeInstruction(index)}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
})}
            </div>

            
            {fieldErrors.instructions && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start" role="alert">
                <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{fieldErrors.instructions}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Step 4: Additional Info */}
      {currentStep === 4 && (
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
            Additional Information
          </h2>

          {/* Time and Servings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="text-sm font-semibold text-gray-700">Prep Time (min)</label>
                {onEnhanceField && (
                  <FieldAIEnhanceButton
                    field="prepTime"
                    currentValue={prepTime}
                    status={getFieldStatus('prepTime')}
                    onEnhance={() => onEnhanceField('prepTime', prepTime)}
                  />
                )}
              </div>
              <input
                type="number"
                value={prepTime}
                onChange={clampedNumericHandler(setPrepTime, 0, 999)}
                min="0"
                max="999"
                step="1"
                placeholder="15"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.prepTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}`}
              />
              {fieldErrors.prepTime && (
                <p className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.prepTime}</p>
              )}
              {onEnhanceField && (() => {
                const s = getFieldSuggestion('prepTime')
                return s ? (
                  <FieldAISuggestionChip
                    field="prepTime"
                    suggestion={s.suggestedValue}
                    currentValue={prepTime}
                    onApply={() => onApplyFieldSuggestion?.('prepTime', s.suggestedValue)}
                    onDismiss={() => onDismissFieldSuggestion?.('prepTime')}
                  />
                ) : null
              })()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="text-sm font-semibold text-gray-700">Cook Time (min)</label>
                {onEnhanceField && (
                  <FieldAIEnhanceButton
                    field="cookTime"
                    currentValue={cookTime}
                    status={getFieldStatus('cookTime')}
                    onEnhance={() => onEnhanceField('cookTime', cookTime)}
                  />
                )}
              </div>
              <input
                type="number"
                value={cookTime}
                onChange={clampedNumericHandler(setCookTime, 0, 999)}
                min="0"
                max="999"
                step="1"
                placeholder="30"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.cookTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}`}
              />
              {fieldErrors.cookTime && (
                <p className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.cookTime}</p>
              )}
              {onEnhanceField && (() => {
                const s = getFieldSuggestion('cookTime')
                return s ? (
                  <FieldAISuggestionChip
                    field="cookTime"
                    suggestion={s.suggestedValue}
                    currentValue={cookTime}
                    onApply={() => onApplyFieldSuggestion?.('cookTime', s.suggestedValue)}
                    onDismiss={() => onDismissFieldSuggestion?.('cookTime')}
                  />
                ) : null
              })()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="text-sm font-semibold text-gray-700">Servings</label>
                {onEnhanceField && (
                  <FieldAIEnhanceButton
                    field="servings"
                    currentValue={servings}
                    status={getFieldStatus('servings')}
                    onEnhance={() => onEnhanceField('servings', servings)}
                  />
                )}
              </div>
              <input
                type="number"
                value={servings}
                onChange={clampedNumericHandler(setServings, 1, 99)}
                min="1"
                max="99"
                step="1"
                placeholder="4"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.servings ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}`}
              />
              {fieldErrors.servings && (
                <p className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.servings}</p>
              )}
              {onEnhanceField && (() => {
                const s = getFieldSuggestion('servings')
                return s ? (
                  <FieldAISuggestionChip
                    field="servings"
                    suggestion={s.suggestedValue}
                    currentValue={servings}
                    onApply={() => onApplyFieldSuggestion?.('servings', s.suggestedValue)}
                    onDismiss={() => onDismissFieldSuggestion?.('servings')}
                  />
                ) : null
              })()}
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-semibold text-gray-900">
                Tags (Optional)
              </h3>
              {onEnhanceField && (
                <FieldAIEnhanceButton
                  field="tags"
                  currentValue={stringifySuggestionList(tags)}
                  status={getFieldStatus('tags')}
                  onEnhance={() => onEnhanceField('tags', tags)}
                />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Add tags (e.g., 'quick', 'healthy', 'vegetarian')"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTag}
                className={UI_STYLES.secondaryButton}
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`${UI_STYLES.tagWithPadding} inline-flex items-center`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {onEnhanceField && (() => {
              const s = getFieldSuggestion('tags')
              return s ? (
                <FieldAISuggestionChip
                  field="tags"
                  suggestion={s.suggestedValue}
                  currentValue={stringifySuggestionList(tags)}
                  onApply={() => onApplyFieldSuggestion?.('tags', s.suggestedValue)}
                  onDismiss={() => onDismissFieldSuggestion?.('tags')}
                />
              ) : null
            })()}
          </div>
          {/* Dietary Restrictions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-semibold text-gray-900">
                Dietary Restrictions (Optional)
              </h3>
              {onEnhanceField && (
                <FieldAIEnhanceButton
                  field="dietaryRestrictions"
                  currentValue={stringifySuggestionList(dietaryRestrictions)}
                  status={getFieldStatus('dietaryRestrictions')}
                  onEnhance={() => onEnhanceField('dietaryRestrictions', dietaryRestrictions)}
                />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={dietaryInput}
                onChange={(e) => setDietaryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDietaryRestriction()
                  }
                }}
                placeholder="e.g., 'vegan', 'gluten-free', 'nut-free'"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addDietaryRestriction}
                className={UI_STYLES.secondaryButton}
              >
                Add
              </button>
            </div>

            {dietaryRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dietaryRestrictions.map((dr, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium inline-flex items-center"
                  >
                    {dr}
                    <button
                      type="button"
                      onClick={() => removeDietaryRestriction(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {onEnhanceField && (() => {
              const s = getFieldSuggestion('dietaryRestrictions')
              return s ? (
                <FieldAISuggestionChip
                  field="dietaryRestrictions"
                  suggestion={s.suggestedValue}
                  currentValue={stringifySuggestionList(dietaryRestrictions)}
                  onApply={() => onApplyFieldSuggestion?.('dietaryRestrictions', s.suggestedValue)}
                  onDismiss={() => onDismissFieldSuggestion?.('dietaryRestrictions')}
                />
              ) : null
            })()}
          </div>
        </div>
      )}
    </div>
  )
})

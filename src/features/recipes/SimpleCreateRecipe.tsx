import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRecipeForm } from './hooks/useRecipeForm'
import { useRecipeValidation } from './hooks/useRecipeValidation'
import { useRecipeSave } from './hooks/useRecipeSave'
import { CollapsibleSection } from './components/CollapsibleSection'
import { COMMON_UNITS, IngredientInput } from '../../components/IngredientInput'
import { UI_STYLES } from '../../utils/uiStyles'
import { clampedNumericHandler } from '../../utils/formUtils'
import { useSimpleCreateSections } from './hooks/useSimpleCreateSections'
import { isFieldSuggestion, useAISuggestions } from './hooks/useAISuggestions'
import type { SuggestibleFieldKey, SuggestibleFieldValue } from './hooks/useAISuggestions'
import { AISuggestionPanel } from './components/AISuggestionPanel'
import { FieldAIEnhanceButton } from './components/FieldAIEnhanceButton'
import { FieldAISuggestionChip } from './components/FieldAISuggestionChip'
import { AIUndoButton } from './components/AIUndoButton'
import { AIBadge } from './components/AIBadge'
import { AISpinnerIcon } from './components/AISpinnerIcon'
import { AI_BUTTON_CLASS, AI_BUTTON_COMPACT_CLASS, AI_STEP_ACTION_BUTTON_CLASS } from './components/aiStyles'
import { FIELD_LABELS } from './constants/aiConstants'
import { getRecipe } from '../../services/recipeStorageApi'
import { useAuth } from '../auth/AuthContext'
import { useAIImageGeneration } from './hooks/useAIImageGeneration'
import { useInstructionRefinement } from './hooks/useInstructionRefinement'
import { InstructionDiffView } from './components/InstructionDiffView'
import { useIngredientNormalization } from './hooks/useIngredientNormalization'
import type { Recipe } from '../../types/nutrition'
import { mapEstimateToNutritionalInfo, useNutritionEstimate } from './hooks/useNutritionEstimate'
import { NutritionEstimatePanel } from './components/NutritionEstimatePanel'
import NutritionFacts from '../../components/NutritionFacts'
import {
  normalizeSuggestionListValue,
  parseSuggestedList,
  stringifySuggestionList,
} from './utils/aiSuggestionValueUtils'

type RecipeFormInitialState = Parameters<typeof useRecipeForm>[0]

const EMPTY_INGREDIENT = { quantity: '', unit: '', item: '' }
const KNOWN_INGREDIENT_UNITS = new Set(COMMON_UNITS.filter(Boolean))
const QUANTITY_PATTERN = /^(\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/

const mapIngredientStringToFormValue = (ingredient: string) => {
  const trimmedIngredient = ingredient.trim()

  if (!trimmedIngredient) {
    return EMPTY_INGREDIENT
  }

  const parts = trimmedIngredient.split(/\s+/)

  if (parts.length === 1 || !QUANTITY_PATTERN.test(parts[0])) {
    return { quantity: '', unit: '', item: trimmedIngredient }
  }

  const quantity = parts[0]
  const normalizedUnit = parts[1]?.toLowerCase() || ''
  const hasKnownUnit = KNOWN_INGREDIENT_UNITS.has(normalizedUnit)
  const unit = hasKnownUnit ? parts[1] : ''
  const item = hasKnownUnit ? parts.slice(2).join(' ') : parts.slice(1).join(' ')

  return { quantity, unit, item }
}

const getInitialFormState = (recipe: Recipe): RecipeFormInitialState => {
  const tips = (recipe.tips || {}) as Record<string, unknown>
  const storage = (tips.storage || tips.storageInstructions || '') as string
  const makeAhead = (tips.makeAhead || tips.makeAheadTips || '') as string
  const reheating = (tips.reheating || tips.reheatingInstructions || '') as string
  const substitutions = (Array.isArray(tips.substitutions) ? tips.substitutions : []) as string[]
  const variations = (Array.isArray(tips.variations) ? tips.variations : []) as string[]

  return {
    title: recipe.recipeName || '',
    description: recipe.description || '',
    prepTime: recipe.prepTimeMinutes?.toString() || '',
    cookTime: recipe.cookTimeMinutes?.toString() || '',
    servings: recipe.servings?.toString() || '',
    ingredients: recipe.ingredients?.length
      ? recipe.ingredients.map(mapIngredientStringToFormValue)
      : [EMPTY_INGREDIENT],
    instructions: recipe.instructions?.length ? recipe.instructions : [''],
    tags: recipe.tags || [],
    dietaryRestrictions: recipe.dietaryRestrictions || [],
    imagePreview: recipe.imageUrl || null,
    storageInstructions: storage,
    makeAheadTips: makeAhead,
    reheatingInstructions: reheating,
    substitutions,
    variations,
  }
}

interface QuickEntryRecipeFormProps {
  isEditMode: boolean
  recipeId?: string
  initialState?: RecipeFormInitialState
  recipeOverrides?: Partial<Recipe>
}

const QuickEntryRecipeForm: React.FC<QuickEntryRecipeFormProps> = ({
  isEditMode,
  recipeId,
  initialState,
  recipeOverrides = {},
}) => {
  const navigate = useNavigate()
  const [activeRecipeOverrides, setActiveRecipeOverrides] = useState<Partial<Recipe>>(recipeOverrides)

  const form = useRecipeForm(initialState)
  const { validateForm, buildRecipeObject } = useRecipeValidation()
  const sections = useSimpleCreateSections()
  const {
    setTitle,
    setDescription,
    setPrepTime,
    setCookTime,
    setServings,
    setTags,
    setDietaryRestrictions,
  } = form

  const { handleSubmit } = useRecipeSave({
    recipeId,
    title: form.title,
    description: form.description,
    prepTime: form.prepTime,
    cookTime: form.cookTime,
    servings: form.servings,
    ingredients: form.ingredients,
    instructions: form.instructions,
    tags: form.tags,
    dietaryRestrictions: form.dietaryRestrictions,
    storageInstructions: form.storageInstructions,
    makeAheadTips: form.makeAheadTips,
    reheatingInstructions: form.reheatingInstructions,
    substitutions: form.substitutions,
    variations: form.variations,
    imagePreview: form.imagePreview,
    recipeOverrides: activeRecipeOverrides,
    setFieldErrors: form.setFieldErrors,
    setStepsWithErrors: form.setStepsWithErrors,
    setSaveLoading: form.setSaveLoading,
    setSaveError: form.setSaveError,
    validateForm,
    buildRecipeObject,
    // No step navigation in simple form — no-op
    goToStep: () => {},
  })

  const handleCancel = useCallback(() => {
    navigate(isEditMode && recipeId ? `/dashboard/recipes/${recipeId}` : '/dashboard/recipes')
  }, [isEditMode, navigate, recipeId])

  const {
    visibleSuggestions,
    status: suggestionStatus,
    error: suggestionError,
    fetchSuggestions,
    fetchFieldSuggestion,
    fieldStatus,
    fieldErrors: fieldSuggestionErrors,
    applySuggestion,
    dismissSuggestion,
    canUndo,
    undoLastAIChange,
    auditLog,
  } = useAISuggestions()
  const {
    estimate: nutritionEstimate,
    loadingState: nutritionLoadingState,
    error: nutritionError,
    estimateNutrition,
    clearEstimate: clearNutritionEstimate,
    acceptEstimate: acceptNutritionEstimate,
  } = useNutritionEstimate()

  const { status: aiImageStatus, error: aiImageError, generateImage } = useAIImageGeneration()

  const {
    normalizationStates,
    applyNormalization,
    dismissNormalization,
  } = useIngredientNormalization(form.updateIngredient)

  const {
    stepStates: instructionRefinementStates,
    loadingState: instructionRefinementLoading,
    refineSingle: refineSingleInstruction,
    refineAll: refineAllInstructions,
    acceptStep: acceptInstructionRefinement,
    rejectStep: rejectInstructionRefinement,
  } = useInstructionRefinement(form.updateInstruction)

  const handleRefineInstruction = useCallback(
    (index: number, instruction: string) => {
      refineSingleInstruction(index, instruction, form.title || undefined)
    },
    [refineSingleInstruction, form.title]
  )

  const handleRefineAllInstructions = useCallback(() => {
    refineAllInstructions(form.instructions, form.title || undefined)
  }, [refineAllInstructions, form.instructions, form.title])

  const handleGenerateAIImage = useCallback(async () => {
    if (!form.title.trim()) return
    const url = await generateImage(form.title.trim(), form.description.trim() || undefined)
    if (url) {
      form.setImagePreview(url)
    }
  }, [form.title, form.description, form.setImagePreview, generateImage])

  const buildSuggestionRequest = () => ({
    recipeName: form.title || undefined,
    description: form.description || undefined,
    prepTime: form.prepTime || undefined,
    cookTime: form.cookTime || undefined,
    servings: form.servings || undefined,
    tags: form.tags.length > 0 ? form.tags : undefined,
    dietaryRestrictions: form.dietaryRestrictions.length > 0 ? form.dietaryRestrictions : undefined,
    ingredients: form.ingredients.filter(i => i.item.trim()).map(i =>
      [i.quantity, i.unit, i.item].filter(Boolean).join(' ')
    ),
    instructions: form.instructions.filter(i => i.trim()),
  })

  const fieldSetters: Partial<Record<string, (value: string) => void>> = useMemo(() => ({
    recipeName: setTitle,
    description: setDescription,
    prepTime: setPrepTime,
    cookTime: setCookTime,
    servings: setServings,
    tags: (value: string) => setTags(parseSuggestedList(value)),
    dietaryRestrictions: (value: string) => setDietaryRestrictions(parseSuggestedList(value)),
    storageInstructions: form.setStorageInstructions,
    makeAheadTips: form.setMakeAheadTips,
    reheatingInstructions: form.setReheatingInstructions,
    substitutions: (value: string) => form.setSubstitutions(parseSuggestedList(value)),
    variations: (value: string) => form.setVariations(parseSuggestedList(value)),
  }), [
    setTitle,
    setDescription,
    setPrepTime,
    setCookTime,
    setServings,
    setTags,
    setDietaryRestrictions,
    form.setStorageInstructions,
    form.setMakeAheadTips,
    form.setReheatingInstructions,
    form.setSubstitutions,
    form.setVariations,
  ])

  const currentValues: Partial<Record<string, string>> = useMemo(() => ({
    recipeName: form.title,
    description: form.description,
    prepTime: form.prepTime,
    cookTime: form.cookTime,
    servings: form.servings,
    tags: stringifySuggestionList(form.tags),
    dietaryRestrictions: stringifySuggestionList(form.dietaryRestrictions),
    storageInstructions: form.storageInstructions,
    makeAheadTips: form.makeAheadTips,
    reheatingInstructions: form.reheatingInstructions,
    substitutions: stringifySuggestionList(form.substitutions),
    variations: stringifySuggestionList(form.variations),
  }), [
    form.title,
    form.description,
    form.prepTime,
    form.cookTime,
    form.servings,
    form.tags,
    form.dietaryRestrictions,
    form.storageInstructions,
    form.makeAheadTips,
    form.reheatingInstructions,
    form.substitutions,
    form.variations,
  ])

  const previousSuggestionValues = useMemo<Record<string, unknown>>(() => ({
    recipeName: form.title,
    description: form.description,
    prepTime: form.prepTime,
    cookTime: form.cookTime,
    servings: form.servings,
    tags: form.tags,
    dietaryRestrictions: form.dietaryRestrictions,
    storageInstructions: form.storageInstructions,
    makeAheadTips: form.makeAheadTips,
    reheatingInstructions: form.reheatingInstructions,
    substitutions: form.substitutions,
    variations: form.variations,
  }), [
    form.title,
    form.description,
    form.prepTime,
    form.cookTime,
    form.servings,
    form.tags,
    form.dietaryRestrictions,
    form.storageInstructions,
    form.makeAheadTips,
    form.reheatingInstructions,
    form.substitutions,
    form.variations,
  ])

  const handleEnhanceField = useCallback(<K extends SuggestibleFieldKey>(field: K, currentValue: SuggestibleFieldValue<K>) => {
    fetchFieldSuggestion(field, currentValue, {
      recipeName: form.title,
      description: form.description,
      tags: form.tags.length > 0 ? form.tags : undefined,
      dietaryRestrictions: form.dietaryRestrictions.length > 0 ? form.dietaryRestrictions : undefined,
      ingredients: form.ingredients.filter(i => i.item.trim()).map(i =>
        [i.quantity, i.unit, i.item].filter(Boolean).join(' ')
      ),
      instructions: form.instructions.filter(i => i.trim()),
    })
  }, [
    fetchFieldSuggestion,
    form.title,
    form.description,
    form.tags,
    form.dietaryRestrictions,
    form.ingredients,
    form.instructions,
  ])

  const handleApplyFieldSuggestion = useCallback((suggestion: import('./hooks/useAISuggestions').FieldSuggestion) => {
    const setter = fieldSetters[suggestion.field]
    const previous = previousSuggestionValues[suggestion.field] ?? ''
    if (setter) {
      applySuggestion(suggestion, () => setter(suggestion.suggestedValue), previous)
    }
  }, [fieldSetters, previousSuggestionValues, applySuggestion])

  const handleEnhanceWithAI = () => {
    fetchSuggestions(buildSuggestionRequest())
  }

  const fieldVisibleSuggestions = useMemo(
    () => visibleSuggestions.filter(isFieldSuggestion),
    [visibleSuggestions]
  )

  const getFieldSuggestion = useCallback(
    (field: string) => fieldVisibleSuggestions.find(suggestion => suggestion.field === field),
    [fieldVisibleSuggestions]
  )

  const getFieldSuggestionError = useCallback(
    (field: string) => fieldSuggestionErrors.get(field) ?? null,
    [fieldSuggestionErrors]
  )

  const renderFieldAIFeedback = useCallback(<K extends SuggestibleFieldKey,>(
    field: K,
    currentValue: string,
    fieldValue: SuggestibleFieldValue<K>
  ) => {
    const suggestion = getFieldSuggestion(field)
    const error = getFieldSuggestionError(field)

    if (!suggestion && !error) return null

    return (
      <FieldAISuggestionChip
        field={field}
        suggestion={suggestion?.suggestedValue ?? ''}
        reason={suggestion?.reason}
        currentValue={currentValue}
        error={error}
        onApply={() => {
          if (suggestion) handleApplyFieldSuggestion(suggestion)
        }}
        onDismiss={() => {
          if (suggestion) dismissSuggestion(suggestion)
        }}
        onRetry={() => handleEnhanceField(field, fieldValue)}
      />
    )
  }, [dismissSuggestion, getFieldSuggestion, getFieldSuggestionError, handleApplyFieldSuggestion, handleEnhanceField])

  const lastUndoableAIField = useMemo<string | null>(() => {
    const latestEntry = auditLog[auditLog.length - 1]
    return latestEntry?.event === 'accepted' ? latestEntry.field : null
  }, [auditLog])

  const handleUndo = useCallback(() => {
    const result = undoLastAIChange()
    if (!result) return
    const listFieldSetter =
      {
        tags: form.setTags,
        dietaryRestrictions: form.setDietaryRestrictions,
      }[result.field]
    if (listFieldSetter) {
      listFieldSetter(normalizeSuggestionListValue(result.previousValue))
      return
    }
    const setter = fieldSetters[result.field]
    if (setter) setter(String(result.previousValue ?? ''))
  }, [undoLastAIChange, fieldSetters, form.setTags, form.setDietaryRestrictions])
  const hasIngredients = form.ingredients.some((ingredient) => ingredient.item.trim())
  const hasSavedNutrition = Boolean(activeRecipeOverrides.nutritionalInfo?.perServing)

  const handleAcceptNutritionEstimate = useCallback(() => {
    acceptNutritionEstimate((estimate) => {
      setActiveRecipeOverrides((prev) => ({
        ...prev,
        nutritionalInfo: mapEstimateToNutritionalInfo(estimate),
      }))
    })
  }, [acceptNutritionEstimate])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isEditMode ? 'Edit Recipe' : 'Create Recipe'}
          </h1>
          <div className="flex items-center gap-2">
            <AIUndoButton
              key={auditLog.length}
              lastField={canUndo ? lastUndoableAIField : null}
              onUndo={handleUndo}
              fieldLabels={FIELD_LABELS}
            />
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
          </div>
        </div>

        {/* Entry-point mode toggle */}
        {!isEditMode && (
          <nav
            className="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-1 mb-6"
            aria-label="Recipe creation mode"
          >
            <Link
              to="/dashboard/create"
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-slate-900 transition-colors"
            >
              🧭 Guided (step-by-step)
            </Link>
            <Link
              to="/dashboard/create/simple"
              aria-current="page"
              className="px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm border border-gray-200 dark:border-slate-600"
            >
              ⚡ Quick entry
            </Link>
          </nav>
        )}

        <p className="text-sm text-gray-500">
          {isEditMode
            ? 'Update everything at once. Required fields are always visible; optional sections can be expanded as needed.'
            : 'Fill in everything at once. Required fields are always visible; optional sections can be expanded as needed.'}
        </p>
      </div>

      {/* Save error banner */}
      {form.saveError && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
          role="alert"
        >
          <svg
            className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{form.saveError}</p>
          </div>
          <button
            type="button"
            onClick={() => form.setSaveError(null)}
            className="ml-3 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <AISuggestionPanel
        suggestions={visibleSuggestions}
        status={suggestionStatus}
        error={suggestionError}
        onApply={applySuggestion}
        onDismiss={dismissSuggestion}
        fieldSetters={fieldSetters}
        currentValues={currentValues}
        onRetry={handleEnhanceWithAI}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ─── Required: Title ─── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
            Basic Info
          </h2>

          {/* Recipe Name */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <label htmlFor="simple-title" className="text-sm font-semibold text-gray-700">
                Recipe Name <span className="text-red-500">*</span>
              </label>
              <FieldAIEnhanceButton
                field="recipeName"
                currentValue={form.title}
                status={fieldStatus.get('recipeName') ?? 'idle'}
                onEnhance={() => handleEnhanceField('recipeName', form.title)}
              />
            </div>
            <input
              id="simple-title"
              type="text"
              value={form.title}
              onChange={(e) => {
                form.setTitle(e.target.value)
                if (e.target.value) form.clearFieldError('title', 1)
              }}
              placeholder="e.g., Grandma's Chocolate Chip Cookies"
              aria-required="true"
              aria-invalid={!!form.fieldErrors.title}
              aria-describedby={form.fieldErrors.title ? 'simple-title-error' : undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                form.fieldErrors.title
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-emerald-500'
              }`}
            />
            {form.fieldErrors.title && (
              <p
                id="simple-title-error"
                className="mt-1 text-sm text-red-600 flex items-center"
                role="alert"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {form.fieldErrors.title}
              </p>
            )}
{renderFieldAIFeedback('recipeName', form.title, form.title)}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label htmlFor="simple-description" className="text-sm font-semibold text-gray-700">
                Description
              </label>
              <FieldAIEnhanceButton
                field="description"
                currentValue={form.description}
                status={fieldStatus.get('description') ?? 'idle'}
                onEnhance={() => handleEnhanceField('description', form.description)}
              />
            </div>
            <textarea
              id="simple-description"
              value={form.description}
              onChange={(e) => form.setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of your recipe..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
{renderFieldAIFeedback('description', form.description, form.description)}
          </div>
        </div>

        {/* ─── Required: Ingredients ─── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
            Ingredients <span className="text-red-500">*</span>
          </h2>
          <IngredientInput
            ingredients={form.ingredients}
            onAddIngredient={form.addIngredient}
            onUpdateIngredient={form.updateIngredient}
            onRemoveIngredient={form.removeIngredient}
            normalizationStates={normalizationStates}
            onApplyNormalization={applyNormalization}
            onDismissNormalization={dismissNormalization}
          />
          {form.fieldErrors.ingredients && (
            <div
              className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
              role="alert"
            >
              <svg
                className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">{form.fieldErrors.ingredients}</p>
            </div>
          )}
        </div>

        {/* ─── Required: Instructions ─── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Instructions <span className="text-red-500">*</span>
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={form.addInstruction}
                disabled={instructionRefinementLoading === 'loading'}
                className={`${UI_STYLES.addButton} ${instructionRefinementLoading === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add Step</span>
              </button>
              <button
                type="button"
                onClick={handleRefineAllInstructions}
                disabled={instructionRefinementLoading === 'loading' || !form.instructions.some(i => i.trim())}
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
            </div>
          </div>

          <div className="space-y-3">
            {form.instructions.map((instruction, index) => {
              const refinementState = instructionRefinementStates.get(index)
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
                      onChange={(e) => form.updateInstruction(index, e.target.value)}
                      placeholder="Describe this step in detail..."
                      rows={2}
                      disabled={instructionRefinementLoading === 'loading'}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {isPending && refinementState && (
                      <div className="mt-2">
                        <InstructionDiffView
                          original={refinementState.original}
                          refined={refinementState.refined}
                          onAccept={() => acceptInstructionRefinement(index)}
                          onReject={() => rejectInstructionRefinement(index)}
                          isLoading={instructionRefinementLoading === 'loading'}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {instruction.trim() && (
                      <button
                        type="button"
                        onClick={() => handleRefineInstruction(index, instruction)}
                        disabled={instructionRefinementLoading === 'loading'}
                        aria-label={`Refine step ${index + 1} with AI`}
                        title="Refine this step with AI"
                        className={AI_STEP_ACTION_BUTTON_CLASS}
                      >
                        <span aria-hidden="true">AI</span>
                      </button>
                    )}
                    {form.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => form.removeInstruction(index)}
                        disabled={instructionRefinementLoading === 'loading'}
                        aria-label={`Remove step ${index + 1}`}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {form.fieldErrors.instructions && (
            <div
              className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
              role="alert"
            >
              <svg
                className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">{form.fieldErrors.instructions}</p>
            </div>
          )}
        </div>

        {/* ─── Optional sections ─── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
            Optional sections
          </p>

          {/* ⏱ Timing */}
          <CollapsibleSection
            title="Timing"
            icon="⏱"
            isOpen={sections.timing.isOpen}
            isFilled={sections.timing.isFilled(form.prepTime, form.cookTime)}
            onToggle={sections.timing.toggle}
            data-testid="section-timing"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label
                    htmlFor="simple-prep-time"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Prep Time (min)
                  </label>
                  <FieldAIEnhanceButton
                    field="prepTime"
                    currentValue={form.prepTime}
                    status={fieldStatus.get('prepTime') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('prepTime', form.prepTime)}
                  />
                </div>
                <input
                  id="simple-prep-time"
                  type="number"
                  value={form.prepTime}
                  onChange={clampedNumericHandler(form.setPrepTime, 0, 999)}
                  min="0"
                  max="999"
                  step="1"
                  placeholder="15"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
{renderFieldAIFeedback('prepTime', form.prepTime, form.prepTime)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label
                    htmlFor="simple-cook-time"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Cook Time (min)
                  </label>
                  <FieldAIEnhanceButton
                    field="cookTime"
                    currentValue={form.cookTime}
                    status={fieldStatus.get('cookTime') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('cookTime', form.cookTime)}
                  />
                </div>
                <input
                  id="simple-cook-time"
                  type="number"
                  value={form.cookTime}
                  onChange={clampedNumericHandler(form.setCookTime, 0, 999)}
                  min="0"
                  max="999"
                  step="1"
                  placeholder="30"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
{renderFieldAIFeedback('cookTime', form.cookTime, form.cookTime)}
              </div>
            </div>
          </CollapsibleSection>

          {/* 🍽 Serving info */}
          <CollapsibleSection
            title="Serving Info"
            icon="🍽"
            isOpen={sections.serving.isOpen}
            isFilled={sections.serving.isFilled(form.servings)}
            onToggle={sections.serving.toggle}
            data-testid="section-serving"
          >
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label
                  htmlFor="simple-servings"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Servings
                </label>
                <FieldAIEnhanceButton
                  field="servings"
                  currentValue={form.servings}
                  status={fieldStatus.get('servings') ?? 'idle'}
                  onEnhance={() => handleEnhanceField('servings', form.servings)}
                />
              </div>
              <input
                id="simple-servings"
                type="number"
                value={form.servings}
                onChange={clampedNumericHandler(form.setServings, 1, 99)}
                min="1"
                max="99"
                step="1"
                placeholder="4"
                className="w-full sm:w-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
{renderFieldAIFeedback('servings', form.servings, form.servings)}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Nutrition"
            icon="🥗"
            isOpen={sections.nutrition.isOpen}
            isFilled={sections.nutrition.isFilled(hasSavedNutrition)}
            onToggle={sections.nutrition.toggle}
            data-testid="section-nutrition"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Let AI calculate nutrition when your recipe does not already include it.
              </p>
              <button
                type="button"
                disabled={!hasIngredients || nutritionLoadingState === 'loading'}
                onClick={() =>
                  estimateNutrition(form.ingredients, parseInt(form.servings, 10) || 1, form.title)
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
              {hasSavedNutrition && activeRecipeOverrides.nutritionalInfo && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    AI nutrition values will be saved with this recipe unless you recalculate or dismiss them.
                  </p>
                  <NutritionFacts nutritionalInfo={activeRecipeOverrides.nutritionalInfo} />
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* 🏷 Tags & dietary info */}
          <CollapsibleSection
            title="Tags & Dietary Info"
            icon="🏷"
            isOpen={sections.tags.isOpen}
            isFilled={sections.tags.isFilled(form.tags, form.dietaryRestrictions)}
            onToggle={sections.tags.toggle}
            data-testid="section-tags"
          >
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tags (Optional)
                  </label>
                  <FieldAIEnhanceButton
                    field="tags"
                    currentValue={stringifySuggestionList(form.tags)}
                    status={fieldStatus.get('tags') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('tags', form.tags)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={form.tagInput}
                    onChange={(e) => form.setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        form.addTag()
                      }
                    }}
                    placeholder="Add tags (e.g., 'quick', 'healthy', 'vegetarian')"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={form.addTag}
                    className={UI_STYLES.secondaryButton}
                  >
                    Add
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map((tag, index) => (
                      <span
                        key={tag}
                        className={`${UI_STYLES.tagWithPadding} inline-flex items-center`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => form.removeTag(index)}
                          className="ml-2 text-emerald-600 hover:text-emerald-800"
                          aria-label={`Remove tag ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
{renderFieldAIFeedback('tags', stringifySuggestionList(form.tags), form.tags)}
              </div>

              {/* Dietary restrictions */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Dietary Restrictions (Optional)
                  </label>
                  <FieldAIEnhanceButton
                    field="dietaryRestrictions"
                    currentValue={stringifySuggestionList(form.dietaryRestrictions)}
                    status={fieldStatus.get('dietaryRestrictions') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('dietaryRestrictions', form.dietaryRestrictions)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={form.dietaryInput}
                    onChange={(e) => form.setDietaryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        form.addDietaryRestriction()
                      }
                    }}
                    placeholder="e.g., 'vegan', 'gluten-free', 'nut-free'"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={form.addDietaryRestriction}
                    className={UI_STYLES.secondaryButton}
                  >
                    Add
                  </button>
                </div>
                {form.dietaryRestrictions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.dietaryRestrictions.map((dr, index) => (
                      <span
                        key={dr}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium inline-flex items-center"
                      >
                        {dr}
                        <button
                          type="button"
                          onClick={() => form.removeDietaryRestriction(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          aria-label={`Remove dietary restriction ${dr}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
{renderFieldAIFeedback(
  'dietaryRestrictions',
  stringifySuggestionList(form.dietaryRestrictions),
  form.dietaryRestrictions
)}
              </div>
            </div>
          </CollapsibleSection>

          {/* 💡 Tips & Tricks */}
          <CollapsibleSection
            title="Tips & Tricks"
            icon="💡"
            isOpen={sections.tips.isOpen}
            isFilled={sections.tips.isFilled(
              form.storageInstructions,
              form.makeAheadTips,
              form.reheatingInstructions,
              form.substitutions,
              form.variations
            )}
            onToggle={sections.tips.toggle}
            data-testid="section-tips"
          >
            <div className="space-y-6">
              {/* Storage Instructions */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    📦 Storage Instructions
                  </label>
                  <FieldAIEnhanceButton
                    field="storageInstructions"
                    currentValue={form.storageInstructions || ''}
                    status={fieldStatus.get('storageInstructions') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('storageInstructions', form.storageInstructions || '')}
                  />
                </div>
                <textarea
                  value={form.storageInstructions || ''}
                  onChange={(e) => form.setStorageInstructions(e.target.value)}
                  rows={2}
                  placeholder="e.g., Refrigerate in an airtight container for up to three days."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                />
                {renderFieldAIFeedback('storageInstructions', form.storageInstructions || '', form.storageInstructions || '')}
              </div>

              {/* Make-Ahead Tips */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    ⏰ Make-Ahead Tips
                  </label>
                  <FieldAIEnhanceButton
                    field="makeAheadTips"
                    currentValue={form.makeAheadTips || ''}
                    status={fieldStatus.get('makeAheadTips') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('makeAheadTips', form.makeAheadTips || '')}
                  />
                </div>
                <textarea
                  value={form.makeAheadTips || ''}
                  onChange={(e) => form.setMakeAheadTips(e.target.value)}
                  rows={2}
                  placeholder="e.g., Can be chopped and prepped 1 day in advance."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                />
                {renderFieldAIFeedback('makeAheadTips', form.makeAheadTips || '', form.makeAheadTips || '')}
              </div>

              {/* Reheating Instructions */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    🔥 Reheating Instructions
                  </label>
                  <FieldAIEnhanceButton
                    field="reheatingInstructions"
                    currentValue={form.reheatingInstructions || ''}
                    status={fieldStatus.get('reheatingInstructions') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('reheatingInstructions', form.reheatingInstructions || '')}
                  />
                </div>
                <textarea
                  value={form.reheatingInstructions || ''}
                  onChange={(e) => form.setReheatingInstructions(e.target.value)}
                  rows={2}
                  placeholder="e.g., Reheat in oven at 350°F for 10 minutes until warm."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                />
                {renderFieldAIFeedback('reheatingInstructions', form.reheatingInstructions || '', form.reheatingInstructions || '')}
              </div>

              {/* Substitutions */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    🔄 Ingredient Substitutions
                  </label>
                  <FieldAIEnhanceButton
                    field="substitutions"
                    currentValue={stringifySuggestionList(form.substitutions)}
                    status={fieldStatus.get('substitutions') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('substitutions', form.substitutions)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={form.substitutionInput || ''}
                    onChange={(e) => form.setSubstitutionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        form.addSubstitution()
                      }
                    }}
                    placeholder="e.g., 'Use coconut milk instead of heavy cream'"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={form.addSubstitution}
                    className={UI_STYLES.secondaryButton}
                  >
                    Add
                  </button>
                </div>
                {form.substitutions && form.substitutions.length > 0 && (
                  <ul className="space-y-1.5">
                    {form.substitutions.map((sub, index) => (
                      <li key={index} className="flex items-center justify-between px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-medium">
                        <span>🔄 {sub}</span>
                        <button
                          type="button"
                          onClick={() => form.removeSubstitution(index)}
                          className="ml-2 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-bold"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {renderFieldAIFeedback('substitutions', stringifySuggestionList(form.substitutions), form.substitutions)}
              </div>

              {/* Variations */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    ✨ Recipe Variations
                  </label>
                  <FieldAIEnhanceButton
                    field="variations"
                    currentValue={stringifySuggestionList(form.variations)}
                    status={fieldStatus.get('variations') ?? 'idle'}
                    onEnhance={() => handleEnhanceField('variations', form.variations)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={form.variationInput || ''}
                    onChange={(e) => form.setVariationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        form.addVariation()
                      }
                    }}
                    placeholder="e.g., 'Add red chili flakes for extra heat'"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={form.addVariation}
                    className={UI_STYLES.secondaryButton}
                  >
                    Add
                  </button>
                </div>
                {form.variations && form.variations.length > 0 && (
                  <ul className="space-y-1.5">
                    {form.variations.map((variation, index) => (
                      <li key={index} className="flex items-center justify-between px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-200 rounded-lg text-xs font-medium">
                        <span>✨ {variation}</span>
                        <button
                          type="button"
                          onClick={() => form.removeVariation(index)}
                          className="ml-2 text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 font-bold"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {renderFieldAIFeedback('variations', stringifySuggestionList(form.variations), form.variations)}
              </div>
            </div>
          </CollapsibleSection>

          {/* 📸 Photo */}
          <CollapsibleSection
            title="Photo"
            icon="📸"
            isOpen={sections.photo.isOpen}
            isFilled={sections.photo.isFilled(form.imagePreview)}
            onToggle={sections.photo.toggle}
            data-testid="section-photo"
          >
            <div className="space-y-4">
              {!form.imagePreview ? (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, or WEBP (max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={form.handleImageUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={form.imagePreview}
                    alt="Recipe preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={form.removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    aria-label="Remove image"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex flex-col items-start gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleGenerateAIImage}
                  disabled={!form.title.trim() || aiImageStatus === 'loading'}
                  aria-label={form.imagePreview ? 'Regenerate image with AI' : 'Generate image with AI'}
                  className={AI_BUTTON_CLASS}
                >
                  {aiImageStatus === 'loading' ? (
                    <>
                      <AISpinnerIcon />
                      Generating image...
                    </>
                  ) : (
                    <>
                      <AIBadge />
                      {form.imagePreview ? 'Regenerate image with AI' : 'Generate image with AI'}
                    </>
                  )}
                </button>
                {aiImageError && (
                  <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
                    <span aria-hidden="true">⚠️</span> {aiImageError}
                  </p>
                )}
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ─── Action bar ─── */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 rounded-b-xl px-6 py-4 flex items-center justify-between gap-4 shadow-lg">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={form.saveLoading}
            className={`px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm ${
              form.saveLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {form.saveLoading ? (
              <span className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>{isEditMode ? 'Updating…' : 'Saving…'}</span>
              </span>
            ) : (
              isEditMode ? 'Update Recipe' : 'Save Recipe'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export const SimpleCreateRecipe: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser, isLoading: isAuthLoading } = useAuth()
  const isEditMode = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedRecipeId, setLoadedRecipeId] = useState<string | null>(null)
  const [initialState, setInitialState] = useState<RecipeFormInitialState>()
  const [recipeOverrides, setRecipeOverrides] = useState<Partial<Recipe>>({})

  useEffect(() => {
    if (!isEditMode || !id || isAuthLoading) return

    let isMounted = true

    const fetchRecipeForEdit = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const recipe = await getRecipe(id)

        if (recipe.userId !== currentUser?.uid) {
          navigate(`/dashboard/recipes/${id}`, { replace: true })
          return
        }

        if (!isMounted) return

        setLoadedRecipeId(id)
        setInitialState(getInitialFormState(recipe))
        setRecipeOverrides({
          nutritionalInfo: recipe.nutritionalInfo,
          tips: recipe.tips,
          source: recipe.source,
        })
      } catch (err: unknown) {
        if (!isMounted) return

        console.error('Failed to fetch recipe:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recipe'
        const apiError = err as { response?: { data?: { message?: string } } }
        setLoadedRecipeId(null)
        setLoadError(apiError.response?.data?.message || errorMessage)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchRecipeForEdit()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid, id, isAuthLoading, isEditMode, navigate])

  if (isEditMode && (loading || (loadedRecipeId !== id && !loadError))) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    )
  }

  if (isEditMode && loadError) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/recipes')}
          className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Library
        </button>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading recipe</p>
          <p className="text-sm mt-1">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <QuickEntryRecipeForm
      key={id ?? 'create'}
      isEditMode={isEditMode}
      recipeId={id}
      initialState={isEditMode && loadedRecipeId === id ? initialState : undefined}
      recipeOverrides={isEditMode && loadedRecipeId === id ? recipeOverrides : {}}
    />
  )
}

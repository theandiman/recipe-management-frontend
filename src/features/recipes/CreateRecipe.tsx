import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { RecipeFormLayout } from './components/RecipeFormLayout'
import { useRecipeForm } from './hooks/useRecipeForm'
import { useRecipeValidation } from './hooks/useRecipeValidation'
import { useRecipeFormNavigation } from './hooks/useRecipeFormNavigation'
import { useRecipeSave } from './hooks/useRecipeSave'
import { useAISuggestions } from './hooks/useAISuggestions'
import { useIngredientNormalization } from './hooks/useIngredientNormalization'
import type { Recipe } from '../../types/nutrition'
import { UI_STYLES } from '../../utils/uiStyles'

const FIELD_LABELS: Record<string, string> = {
  recipeName: 'Recipe Name',
  description: 'Description',
  prepTime: 'Prep Time',
  cookTime: 'Cook Time',
  servings: 'Servings',
  tags: 'Tags',
  dietaryRestrictions: 'Dietary Restrictions',
}

export const CreateRecipe: React.FC = () => {
  const navigate = useNavigate()

  const navigation = useRecipeFormNavigation()
  const form = useRecipeForm()
  const { validateForm, buildRecipeObject } = useRecipeValidation()
  const { canUndo, auditLog, undoLastAIChange } = useAISuggestions()
  const [recipeOverrides, setRecipeOverrides] = useState<Partial<Recipe>>({})
  const {
    normalizationStates,
    applyNormalization,
    dismissNormalization,
  } = useIngredientNormalization(form.updateIngredient)

  const { handleSubmit } = useRecipeSave({
    title: form.title,
    description: form.description,
    prepTime: form.prepTime,
    cookTime: form.cookTime,
    servings: form.servings,
    ingredients: form.ingredients,
    instructions: form.instructions,
    tags: form.tags,
    dietaryRestrictions: form.dietaryRestrictions,
    imagePreview: form.imagePreview,
    recipeOverrides,
    setFieldErrors: form.setFieldErrors,
    setStepsWithErrors: form.setStepsWithErrors,
    setSaveLoading: form.setSaveLoading,
    setSaveError: form.setSaveError,
    validateForm,
    buildRecipeObject,
    goToStep: navigation.goToStep
  })

  const lastUndoableAIField = useMemo(() => {
    const consumed = new Set<string>()
    for (const e of auditLog) {
      if (e.event === 'undone') {
        for (let i = auditLog.length - 1; i >= 0; i--) {
          const a = auditLog[i]
          if (a.event === 'accepted' && a.field === e.field && !consumed.has(a.id)) {
            consumed.add(a.id)
            break
          }
        }
      }
    }
    for (let i = auditLog.length - 1; i >= 0; i--) {
      const e = auditLog[i]
      if (e.event === 'accepted' && !consumed.has(e.id)) {
        return FIELD_LABELS[e.field] ?? e.field
      }
    }
    return null
  }, [auditLog])

  const handleUndoLastAI = useCallback(() => {
    const result = undoLastAIChange()
    if (!result) return
    const { field, previousValue } = result
    const setters: Record<string, (v: string) => void> = {
      recipeName: form.setTitle,
      description: form.setDescription,
      prepTime: form.setPrepTime,
      cookTime: form.setCookTime,
      servings: form.setServings,
    }
    const setter = setters[field]
    if (setter) setter(String(previousValue ?? ''))
  }, [undoLastAIChange, form.setTitle, form.setDescription, form.setPrepTime, form.setCookTime, form.setServings])

  const handleCancel = useCallback(() => {
    navigate('/dashboard/recipes')
  }, [navigate])

  const modeToggle = (
    <nav
      className="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-1 mb-6"
      aria-label="Recipe creation mode"
    >
      <span
        aria-current="page"
        className="px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm border border-gray-200 dark:border-slate-600"
      >
        🧭 Guided (step-by-step)
      </span>
      <Link
        to="/dashboard/create/simple"
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white dark:hover:bg-slate-900 ${UI_STYLES.mutedText} hover:text-gray-900 dark:hover:text-gray-100`}
      >
        ⚡ Quick entry
      </Link>
    </nav>
  )

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {modeToggle}
      </div>
      <RecipeFormLayout
        mode="create"
        {...navigation}
        canGoNext={!navigation.isLastStep}
        canGoPrevious={!navigation.isFirstStep}
        {...form}
        handleSubmit={handleSubmit}
        handleCancel={handleCancel}
        canUndoAI={canUndo}
        onUndoLastAI={handleUndoLastAI}
        lastUndoableAIField={lastUndoableAIField}
        nutritionalInfo={recipeOverrides.nutritionalInfo}
        onNutritionalInfoChange={(nutritionalInfo) =>
          setRecipeOverrides((prev) => ({ ...prev, nutritionalInfo }))
        }
        normalizationStates={normalizationStates}
        onApplyNormalization={applyNormalization}
        onDismissNormalization={dismissNormalization}
      />
    </div>
  )
}

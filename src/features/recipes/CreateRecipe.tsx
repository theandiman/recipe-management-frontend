import React, { useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { RecipeFormLayout } from './components/RecipeFormLayout'
import { useRecipeForm } from './hooks/useRecipeForm'
import { useRecipeValidation } from './hooks/useRecipeValidation'
import { useRecipeFormNavigation } from './hooks/useRecipeFormNavigation'
import { useRecipeSave } from './hooks/useRecipeSave'

export const CreateRecipe: React.FC = () => {
  const navigate = useNavigate()
  
  // Use custom hooks
  const navigation = useRecipeFormNavigation()
  const form = useRecipeForm()
  const { validateForm, buildRecipeObject } = useRecipeValidation()
  
  // Use shared save logic
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
    setFieldErrors: form.setFieldErrors,
    setStepsWithErrors: form.setStepsWithErrors,
    setSaveLoading: form.setSaveLoading,
    setSaveError: form.setSaveError,
    validateForm,
    buildRecipeObject,
    goToStep: navigation.goToStep
  })

  const handleCancel = useCallback(() => {
    navigate('/dashboard/recipes')
  }, [navigate])

  const modeToggle = (
    <div
      className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 mb-6"
      role="tablist"
      aria-label="Recipe creation mode"
    >
      <span
        role="tab"
        aria-selected={true}
        className="px-4 py-2 rounded-md text-sm font-medium bg-white text-emerald-700 shadow-sm border border-gray-200"
      >
        🧭 Guided (step-by-step)
      </span>
      <Link
        to="/dashboard/create/simple"
        role="tab"
        aria-selected={false}
        className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
      >
        ⚡ Quick entry
      </Link>
    </div>
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
      />
    </div>
  )
}

import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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

  return (
    <RecipeFormLayout
      mode="create"
      {...navigation}
      canGoNext={!navigation.isLastStep}
      canGoPrevious={!navigation.isFirstStep}
      {...form}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  )
}

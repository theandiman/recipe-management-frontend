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
      currentStep={navigation.currentStep}
      totalSteps={navigation.totalSteps}
      steps={navigation.steps}
      goToStep={navigation.goToStep}
      goToNextStep={navigation.goToNextStep}
      goToPreviousStep={navigation.goToPreviousStep}
      canGoNext={!navigation.isLastStep}
      canGoPrevious={!navigation.isFirstStep}
      stepsWithErrors={form.stepsWithErrors}
      title={form.title}
      setTitle={form.setTitle}
      description={form.description}
      setDescription={form.setDescription}
      prepTime={form.prepTime}
      setPrepTime={form.setPrepTime}
      cookTime={form.cookTime}
      setCookTime={form.setCookTime}
      servings={form.servings}
      setServings={form.setServings}
      imagePreview={form.imagePreview}
      handleImageUpload={form.handleImageUpload}
      removeImage={form.removeImage}
      ingredients={form.ingredients}
      addIngredient={form.addIngredient}
      updateIngredient={form.updateIngredient}
      removeIngredient={form.removeIngredient}
      instructions={form.instructions}
      addInstruction={form.addInstruction}
      updateInstruction={form.updateInstruction}
      removeInstruction={form.removeInstruction}
      tags={form.tags}
      tagInput={form.tagInput}
      setTagInput={form.setTagInput}
      addTag={form.addTag}
      removeTag={form.removeTag}
      fieldErrors={form.fieldErrors}
      clearFieldError={form.clearFieldError}
      saveLoading={form.saveLoading}
      saveError={form.saveError}
      setSaveError={form.setSaveError}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  )
}

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecipe } from '../../services/recipeStorageApi'
import { RecipeFormLayout } from './components/RecipeFormLayout'
import { useRecipeForm } from './hooks/useRecipeForm'
import { useRecipeValidation } from './hooks/useRecipeValidation'
import { useRecipeFormNavigation } from './hooks/useRecipeFormNavigation'
import { useRecipeSave } from './hooks/useRecipeSave'

export const EditRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Loading state
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  // Use custom hooks
  const navigation = useRecipeFormNavigation()
  const form = useRecipeForm()
  const { validateForm, buildRecipeObject } = useRecipeValidation()
  
  // Use shared save logic with recipeId for edit mode
  const { handleSubmit } = useRecipeSave({
    recipeId: id,
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

  // Load recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setLoadError(null)
        const data = await getRecipe(id)
        
        // Populate form fields
        form.setTitle(data.recipeName || '')
        form.setDescription(data.description || '')
        form.setPrepTime(data.prepTime?.toString() || '')
        form.setCookTime(data.cookTime?.toString() || '')
        form.setServings(data.servings?.toString() || '')
        
        // Convert ingredients to Ingredient[] format
        if (data.ingredients && data.ingredients.length > 0) {
          const parsedIngredients = data.ingredients.map((ing: string) => {
            const parts = ing.split(' ')
            const quantity = parts[0] || ''
            const unit = parts[1] || ''
            const item = parts.slice(2).join(' ') || ing
            return { quantity, unit, item }
          })
          form.setIngredients(parsedIngredients.length > 0 ? parsedIngredients : [{ quantity: '', unit: '', item: '' }])
        }
        
        form.setInstructions(data.instructions && data.instructions.length > 0 ? data.instructions : [''])
        form.setTags(data.tags || [])
        form.setImagePreview(data.imageUrl || null)
      } catch (err: unknown) {
        console.error('Failed to fetch recipe:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recipe'
        const apiError = err as { response?: { data?: { message?: string } } }
        setLoadError(apiError.response?.data?.message || errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipe()
  }, [id, form.setTitle, form.setDescription, form.setPrepTime, form.setCookTime, form.setServings, form.setIngredients, form.setInstructions, form.setTags, form.setImagePreview])

  const handleCancel = useCallback(() => {
    navigate(`/dashboard/recipes/${id}`)
  }, [navigate, id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    )
  }

  if (loadError) {
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
    <RecipeFormLayout
        mode="edit"
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

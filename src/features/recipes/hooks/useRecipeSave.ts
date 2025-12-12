import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveRecipe, updateRecipe } from '../../../services/recipeStorageApi'
import type { Ingredient } from '../../../types/nutrition'

interface UseRecipeSaveOptions {
  recipeId?: string
  title: string
  description: string
  prepTime: string
  cookTime: string
  servings: string
  ingredients: Ingredient[]
  instructions: string[]
  tags: string[]
  imagePreview: string | null
  setFieldErrors: (errors: Record<string, string>) => void
  setStepsWithErrors: (steps: Set<number>) => void
  setSaveLoading: (loading: boolean) => void
  setSaveError: (error: string | null) => void
  validateForm: (title: string, ingredients: Ingredient[], instructions: string[]) => {
    isValid: boolean
    errors: Record<string, string>
    errorSteps: Set<number>
  }
  buildRecipeObject: (
    title: string,
    description: string,
    prepTime: string,
    cookTime: string,
    servings: string,
    ingredients: Ingredient[],
    instructions: string[],
    tags: string[],
    imagePreview: string | null
  ) => any
  goToStep: (step: number) => void
}

export function useRecipeSave({
  recipeId,
  title,
  description,
  prepTime,
  cookTime,
  servings,
  ingredients,
  instructions,
  tags,
  imagePreview,
  setFieldErrors,
  setStepsWithErrors,
  setSaveLoading,
  setSaveError,
  validateForm,
  buildRecipeObject,
  goToStep
}: UseRecipeSaveOptions) {
  const navigate = useNavigate()

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    // Validate form before submitting
    const validation = validateForm(title, ingredients, instructions)
    
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setStepsWithErrors(validation.errorSteps)
      
      // Find the first step with errors and navigate to it
      if (validation.errorSteps.size > 0) {
        const firstErrorStep = Math.min(...Array.from(validation.errorSteps))
        goToStep(firstErrorStep)
      }
      
      // Show validation error message
      setSaveError(recipeId ? 'Please fix the errors before updating' : 'Please fix the validation errors before saving.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Clear any previous errors
    setFieldErrors({})
    setStepsWithErrors(new Set())
    
    setSaveLoading(true)
    setSaveError(null)
    
    try {
      // Build recipe object using validation hook
      const recipe = buildRecipeObject(
        title,
        description,
        prepTime,
        cookTime,
        servings,
        ingredients,
        instructions,
        tags,
        imagePreview
      )
      
      // Save or update recipe
      if (recipeId) {
        await updateRecipe(recipeId, recipe)
        console.log('Recipe updated successfully')
        navigate(`/dashboard/recipes/${recipeId}`)
      } else {
        const savedRecipe = await saveRecipe(recipe)
        console.log('Recipe saved successfully:', savedRecipe)
        navigate('/dashboard/recipes')
      }
    } catch (err: unknown) {
      console.error(recipeId ? 'Failed to update recipe:' : 'Failed to save recipe:', err)
      const errorMessage = err instanceof Error ? err.message : `Failed to ${recipeId ? 'update' : 'save'} recipe. Please try again.`
      const apiError = err as { response?: { data?: { message?: string } } }
      setSaveError(apiError.response?.data?.message || errorMessage)
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaveLoading(false)
    }
  }, [
    recipeId,
    title,
    description,
    prepTime,
    cookTime,
    servings,
    ingredients,
    instructions,
    tags,
    imagePreview,
    setFieldErrors,
    setStepsWithErrors,
    setSaveLoading,
    setSaveError,
    validateForm,
    buildRecipeObject,
    goToStep,
    navigate
  ])

  return { handleSubmit }
}

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecipe, updateRecipe } from '../../services/recipeStorageApi'
import { StepIndicator } from './components/StepIndicator'
import { RecipeFormSteps } from './components/RecipeFormSteps'
import { RecipePreview } from './components/RecipePreview'
import { useRecipeForm } from './hooks/useRecipeForm'
import { useRecipeValidation } from './hooks/useRecipeValidation'
import { useRecipeFormNavigation } from './hooks/useRecipeFormNavigation'
import type { Ingredient } from '../../types/nutrition'

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
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save handler
  const handleSubmit = useCallback(async () => {
    if (!id) return
    
    const validation = validateForm(form.title, form.ingredients, form.instructions)
    
    if (!validation.isValid) {
      form.setFieldErrors(validation.errors)
      form.setStepsWithErrors(validation.errorSteps)
      navigation.goToStep(Math.min(...Array.from(validation.errorSteps)))
      form.setSaveError('Please fix the errors before updating')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    form.setSaveLoading(true)
    form.setSaveError(null)

    try {
      const recipe = buildRecipeObject(
        form.title,
        form.description,
        form.prepTime,
        form.cookTime,
        form.servings,
        form.ingredients,
        form.instructions,
        form.tags,
        form.imagePreview
      )
      await updateRecipe(id, recipe)
      navigate(`/dashboard/recipes/${id}`)
    } catch (err: unknown) {
      console.error('Failed to update recipe:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recipe. Please try again.'
      const apiError = err as { response?: { data?: { message?: string } } }
      form.setSaveError(apiError.response?.data?.message || errorMessage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      form.setSaveLoading(false)
    }
  }, [id, validateForm, buildRecipeObject, navigate, form, navigation])

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with Step Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Edit Recipe</h1>
            <p className="text-sm sm:text-base text-gray-600">Step {navigation.currentStep} of {navigation.totalSteps}: {navigation.steps[navigation.currentStep - 1].title}</p>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <StepIndicator
          steps={navigation.steps}
          currentStep={navigation.currentStep}
          stepsWithErrors={form.stepsWithErrors}
          onStepClick={navigation.goToStep}
        />
      </div>

      {/* Step 5: Preview Mode */}
      <AnimatePresence mode="wait">
        {navigation.currentStep === 5 ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <RecipePreview
              saveError={form.saveError}
              setSaveError={form.setSaveError}
              title={form.title}
              description={form.description}
              imagePreview={form.imagePreview}
              prepTime={form.prepTime}
              cookTime={form.cookTime}
              servings={form.servings}
              ingredients={form.ingredients}
              instructions={form.instructions}
              tags={form.tags}
              prevStep={navigation.goToPreviousStep}
              handleCancel={handleCancel}
              handleSubmit={handleSubmit}
              saveLoading={form.saveLoading}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`step-${navigation.currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <RecipeFormSteps
                currentStep={navigation.currentStep}
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
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={navigation.goToPreviousStep}
                  disabled={navigation.isFirstStep}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    navigation.isFirstStep
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

                  <motion.button
                    type="button"
                    onClick={navigation.goToNextStep}
                    className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Next →
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

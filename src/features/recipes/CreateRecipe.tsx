import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { saveRecipe } from '../../services/recipeStorageApi'
import { StepIndicator } from './components/StepIndicator'
import { RecipeFormSteps } from './components/RecipeFormSteps'
import { RecipePreview } from './components/RecipePreview'
import { UI_STYLES } from '../../utils/uiStyles'
import { useRecipeForm } from './hooks/useRecipeForm'
import { useRecipeValidation } from './hooks/useRecipeValidation'
import { useRecipeFormNavigation } from './hooks/useRecipeFormNavigation'

export const CreateRecipe: React.FC = () => {
  const navigate = useNavigate()
  
  // Use custom hooks
  const navigation = useRecipeFormNavigation()
  const form = useRecipeForm()
  const { validateForm, buildRecipeObject } = useRecipeValidation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submitting
    const validation = validateForm(form.title, form.ingredients, form.instructions)
    
    if (!validation.isValid) {
      form.setFieldErrors(validation.errors)
      form.setStepsWithErrors(validation.errorSteps)
      
      // Find the first step with errors and navigate to it
      if (validation.errorSteps.size > 0) {
        const firstErrorStep = Math.min(...Array.from(validation.errorSteps))
        navigation.goToStep(firstErrorStep)
      }
      // Show validation error message
      form.setSaveError('Please fix the validation errors before saving.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Clear any previous errors
    form.setFieldErrors({})
    form.setStepsWithErrors(new Set())
    
    form.setSaveLoading(true)
    form.setSaveError(null)
    
    try {
      // Build recipe object using validation hook
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
      
      // Save recipe
      const savedRecipe = await saveRecipe(recipe)
      
      console.log('Recipe saved successfully:', savedRecipe)
      
      // Navigate back to recipe library on success
      navigate('/dashboard/recipes')
    } catch (err: unknown) {
      console.error('Failed to save recipe:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save recipe. Please try again.'
      const apiError = err as { response?: { data?: { message?: string } } }
      form.setSaveError(apiError.response?.data?.message || errorMessage)
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      form.setSaveLoading(false)
    }
  }

  const handleCancel = useCallback(() => {
    navigate('/dashboard/recipes')
  }, [navigate])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with Step Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Create Recipe</h1>
            <p className="text-sm sm:text-base text-gray-600">Step {navigation.currentStep} of {navigation.totalSteps}: {navigation.steps[navigation.currentStep - 1].title}</p>
          </div>
        </div>

        {/* Step Progress Indicator - Horizontal scroll on mobile */}
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

                  {!navigation.isLastStep ? (
                    <motion.button
                      type="button"
                      onClick={navigation.goToNextStep}
                      className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Next →
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={handleSubmit}
                      disabled={form.saveLoading}
                      className={UI_STYLES.primaryButton}
                      whileHover={{ scale: form.saveLoading ? 1 : 1.02 }}
                      whileTap={{ scale: form.saveLoading ? 1 : 0.98 }}
                    >
                      {form.saveLoading ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Recipe</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

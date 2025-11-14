import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { saveRecipe } from '../../services/recipeStorageApi'
import { StepIndicator } from './components/StepIndicator'
import { RecipeFormSteps } from './components/RecipeFormSteps'
import { RecipePreview } from './components/RecipePreview'
import { UI_STYLES } from '../../utils/uiStyles'
import type { Recipe, Ingredient } from '../../types/nutrition'

export const CreateRecipe: React.FC = () => {
  const navigate = useNavigate()
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  
  // Save state
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [stepsWithErrors, setStepsWithErrors] = useState<Set<number>>(new Set())
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prepTime, setPrepTime] = useState<string>('')
  const [cookTime, setCookTime] = useState<string>('')
  const [servings, setServings] = useState<string>('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ quantity: '', unit: '', item: '' }])
  const [instructions, setInstructions] = useState<string[]>([''])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Helper function to clear field errors
  const clearFieldError = useCallback((fieldName: string, stepNumber: number) => {
    if (fieldErrors[fieldName]) {
      const newErrors = { ...fieldErrors }
      delete newErrors[fieldName]
      setFieldErrors(newErrors)
      const newStepsWithErrors = new Set(stepsWithErrors)
      newStepsWithErrors.delete(stepNumber)
      setStepsWithErrors(newStepsWithErrors)
    }
  }, [fieldErrors, stepsWithErrors])

  // Ingredient handlers
  const addIngredient = useCallback(() => {
    setIngredients([...ingredients, { quantity: '', unit: '', item: '' }])
  }, [ingredients])

  const updateIngredient = useCallback((index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setIngredients(newIngredients)
    
    // Clear ingredients error when user starts adding data
    if (field === 'item' && value.trim()) {
      clearFieldError('ingredients', 2)
    }
  }, [ingredients, clearFieldError])

  const removeIngredient = useCallback((index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index)
      setIngredients(newIngredients)
      
      // Re-validate ingredients after removal
      const hasValidIngredient = newIngredients.some(ing => ing.item.trim())
      if (!hasValidIngredient) {
        const newErrors = { ...fieldErrors, ingredients: 'At least one ingredient is required' }
        setFieldErrors(newErrors)
        const newStepsWithErrors = new Set(stepsWithErrors)
        newStepsWithErrors.add(2)
        setStepsWithErrors(newStepsWithErrors)
      }
    }
  }, [ingredients, fieldErrors, stepsWithErrors])

  // Instruction handlers
  const addInstruction = useCallback(() => {
    setInstructions([...instructions, ''])
  }, [instructions])

  const updateInstruction = useCallback((index: number, value: string) => {
    const newInstructions = [...instructions]
    newInstructions[index] = value
    setInstructions(newInstructions)
    
    // Clear instructions error when user starts adding data
    if (value.trim()) {
      clearFieldError('instructions', 3)
    }
  }, [instructions, clearFieldError])

  const removeInstruction = useCallback((index: number) => {
    if (instructions.length > 1) {
      const newInstructions = instructions.filter((_, i) => i !== index)
      setInstructions(newInstructions)
      
      // Re-validate instructions after removal
      const hasValidInstruction = newInstructions.some(inst => inst.trim())
      if (!hasValidInstruction) {
        const newErrors = { ...fieldErrors, instructions: 'At least one instruction is required' }
        setFieldErrors(newErrors)
        const newStepsWithErrors = new Set(stepsWithErrors)
        newStepsWithErrors.add(3)
        setStepsWithErrors(newStepsWithErrors)
      }
    }
  }, [instructions, fieldErrors, stepsWithErrors])

  // Tag handlers
  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }, [tagInput, tags])

  const removeTag = useCallback((index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }, [tags])

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const removeImage = useCallback(() => {
    setImagePreview(null)
  }, [])

  // Validation function
  const validateForm = useCallback((): { isValid: boolean; errors: Record<string, string>; errorSteps: Set<number> } => {
    const errors: Record<string, string> = {}
    const errorSteps = new Set<number>()

    // Step 1: Basic Info - Recipe name is required
    if (!title.trim()) {
      errors.title = 'Recipe name is required'
      errorSteps.add(1)
    }

    // Step 2: Ingredients - At least one ingredient with an item is required
    const hasValidIngredient = ingredients.some(ing => ing.item.trim())
    if (!hasValidIngredient) {
      errors.ingredients = 'At least one ingredient is required'
      errorSteps.add(2)
    }

    // Step 3: Instructions - At least one instruction is required
    const hasValidInstruction = instructions.some(inst => inst.trim())
    if (!hasValidInstruction) {
      errors.instructions = 'At least one instruction is required'
      errorSteps.add(3)
    }

    return { isValid: Object.keys(errors).length === 0, errors, errorSteps }
  }, [title, ingredients, instructions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submitting
    const validation = validateForm()
    
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setStepsWithErrors(validation.errorSteps)
      
      // Find the first step with errors and navigate to it
      if (validation.errorSteps.size > 0) {
        const firstErrorStep = Math.min(...Array.from(validation.errorSteps))
        setCurrentStep(firstErrorStep)
      }
      // Show validation error message
      setSaveError('Please fix the validation errors before saving.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Clear any previous errors
    setFieldErrors({})
    setStepsWithErrors(new Set())
    
    setSaveLoading(true)
    setSaveError(null)
    
    try {
      // Convert structured ingredients to formatted strings
      const ingredientStrings = ingredients
        .filter(i => i.item.trim())
        .map(i => {
          const parts = [i.quantity, i.unit, i.item]
          return parts.filter(p => p.trim()).join(' ').trim()
        })

      // Convert form data to Recipe format
      const recipe: Recipe = {
        recipeName: title,
        description: description || undefined,
        prepTime: prepTime ? `${prepTime} minutes` : undefined,
        cookTime: cookTime ? `${cookTime} minutes` : undefined,
        servings: servings ? parseInt(servings) : 1,
        ingredients: ingredientStrings,
        instructions: instructions.filter(i => i.trim()),
        imageUrl: imagePreview || undefined,
        source: 'manual'
      }
      
      // Save with user-created source
      const savedRecipe = await saveRecipe(recipe)
      
      console.log('Recipe saved successfully:', savedRecipe)
      
      // Navigate back to recipe library on success
      navigate('/dashboard/recipes')
    } catch (err: any) {
      console.error('Failed to save recipe:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save recipe. Please try again.'
      setSaveError(errorMessage)
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleCancel = useCallback(() => {
    navigate('/dashboard/recipes')
  }, [navigate])

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, totalSteps])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  const steps = useMemo(() => [
    { number: 1, title: 'Basic Info', icon: '📝' },
    { number: 2, title: 'Ingredients', icon: '🥕' },
    { number: 3, title: 'Instructions', icon: '👨‍🍳' },
    { number: 4, title: 'Additional Info', icon: '⏱️' },
    { number: 5, title: 'Review', icon: '✅' }
  ], [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with Step Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Create Recipe</h1>
            <p className="text-sm sm:text-base text-gray-600">Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}</p>
          </div>
        </div>

        {/* Step Progress Indicator - Horizontal scroll on mobile */}
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          stepsWithErrors={stepsWithErrors}
          onStepClick={goToStep}
        />
      </div>

      {/* Step 5: Preview Mode */}
      <AnimatePresence mode="wait">
        {currentStep === 5 ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <RecipePreview
              saveError={saveError}
              setSaveError={setSaveError}
              title={title}
              description={description}
              imagePreview={imagePreview}
              prepTime={prepTime}
              cookTime={cookTime}
              servings={servings}
              ingredients={ingredients}
              instructions={instructions}
              tags={tags}
              prevStep={prevStep}
              handleCancel={handleCancel}
              handleSubmit={handleSubmit}
              saveLoading={saveLoading}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <RecipeFormSteps
                currentStep={currentStep}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                prepTime={prepTime}
                setPrepTime={setPrepTime}
                cookTime={cookTime}
                setCookTime={setCookTime}
                servings={servings}
                setServings={setServings}
                imagePreview={imagePreview}
                handleImageUpload={handleImageUpload}
                removeImage={removeImage}
                ingredients={ingredients}
                addIngredient={addIngredient}
                updateIngredient={updateIngredient}
                removeIngredient={removeIngredient}
                instructions={instructions}
                addInstruction={addInstruction}
                updateInstruction={updateInstruction}
                removeInstruction={removeInstruction}
                tags={tags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                addTag={addTag}
                removeTag={removeTag}
                fieldErrors={fieldErrors}
                clearFieldError={clearFieldError}
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentStep === 1
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

                  {currentStep < totalSteps ? (
                    <motion.button
                      type="button"
                      onClick={nextStep}
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
                      disabled={saveLoading}
                      className={UI_STYLES.primaryButton}
                      whileHover={{ scale: saveLoading ? 1 : 1.02 }}
                      whileTap={{ scale: saveLoading ? 1 : 0.98 }}
                    >
                      {saveLoading ? (
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

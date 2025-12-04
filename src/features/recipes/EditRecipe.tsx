import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecipe, updateRecipe } from '../../services/recipeStorageApi'
import { StepIndicator } from './components/StepIndicator'
import { RecipeFormSteps } from './components/RecipeFormSteps'
import { RecipePreview } from './components/RecipePreview'
import type { Recipe, Ingredient } from '../../types/nutrition'

export const EditRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Loading state
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  
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

  // Load recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setLoadError(null)
        const data = await getRecipe(id)
        
        // Populate form fields
        setTitle(data.recipeName || data.title || '')
        setDescription(data.description || '')
        setPrepTime(data.prepTime?.toString() || '')
        setCookTime(data.cookTime?.toString() || '')
        setServings(data.servings?.toString() || '')
        
        // Convert ingredients to Ingredient[] format
        if (data.ingredients && data.ingredients.length > 0) {
          const parsedIngredients = data.ingredients.map((ing: string) => {
            const parts = ing.split(' ')
            const quantity = parts[0] || ''
            const unit = parts[1] || ''
            const item = parts.slice(2).join(' ') || ing
            return { quantity, unit, item }
          })
          setIngredients(parsedIngredients.length > 0 ? parsedIngredients : [{ quantity: '', unit: '', item: '' }])
        }
        
        setInstructions(data.instructions && data.instructions.length > 0 ? data.instructions : [''])
        setImagePreview(data.imageUrl || null)
      } catch (err: any) {
        console.error('Failed to fetch recipe:', err)
        setLoadError(err.response?.data?.message || err.message || 'Failed to load recipe')
      } finally {
        setLoading(false)
      }
    }

    fetchRecipe()
  }, [id])

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
    
    if (field === 'item' && value.trim()) {
      clearFieldError('ingredients', 2)
    }
  }, [ingredients, clearFieldError])

  const removeIngredient = useCallback((index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index)
      setIngredients(newIngredients)
      
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
    
    if (value.trim()) {
      clearFieldError('instructions', 3)
    }
  }, [instructions, clearFieldError])

  const removeInstruction = useCallback((index: number) => {
    if (instructions.length > 1) {
      const newInstructions = instructions.filter((_, i) => i !== index)
      setInstructions(newInstructions)
      
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

    if (!title.trim()) {
      errors.title = 'Recipe name is required'
      errorSteps.add(1)
    }

    const hasValidIngredient = ingredients.some(ing => ing.item.trim())
    if (!hasValidIngredient) {
      errors.ingredients = 'At least one ingredient is required'
      errorSteps.add(2)
    }

    const hasValidInstruction = instructions.some(inst => inst.trim())
    if (!hasValidInstruction) {
      errors.instructions = 'At least one instruction is required'
      errorSteps.add(3)
    }

    return { isValid: Object.keys(errors).length === 0, errors, errorSteps }
  }, [title, ingredients, instructions])

  // Build recipe object
  const buildRecipeObject = useCallback((): Recipe => {
    const ingredientStrings = ingredients
      .filter(ing => ing.item.trim())
      .map(ing => `${ing.quantity} ${ing.unit} ${ing.item}`.trim())

    const validInstructions = instructions.filter(inst => inst.trim())

    return {
      recipeName: title.trim(),
      description: description.trim() || undefined,
      ingredients: ingredientStrings,
      instructions: validInstructions,
      prepTime: prepTime ? `${prepTime} minutes` : undefined,
      cookTime: cookTime ? `${cookTime} minutes` : undefined,
      servings: servings || '1',
      imageUrl: imagePreview || undefined,
      source: 'manual' as const
    }
  }, [title, description, ingredients, instructions, prepTime, cookTime, servings, imagePreview])

  // Save handler
  const handleSubmit = useCallback(async () => {
    if (!id) return
    
    const validation = validateForm()
    
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setStepsWithErrors(validation.errorSteps)
      setCurrentStep(Math.min(...Array.from(validation.errorSteps)))
      setSaveError('Please fix the errors before updating')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaveLoading(true)
    setSaveError(null)

    try {
      const recipe = buildRecipeObject()
      await updateRecipe(id, recipe)
      navigate(`/dashboard/recipes/${id}`)
    } catch (err: any) {
      console.error('Failed to update recipe:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update recipe. Please try again.'
      setSaveError(errorMessage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaveLoading(false)
    }
  }, [id, validateForm, buildRecipeObject, navigate])

  const handleCancel = useCallback(() => {
    navigate(`/dashboard/recipes/${id}`)
  }, [navigate, id])

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  const steps = [
    { number: 1, title: 'Basic Info', icon: '📝' },
    { number: 2, title: 'Ingredients', icon: '🥕' },
    { number: 3, title: 'Instructions', icon: '👨‍🍳' },
    { number: 4, title: 'Additional Info', icon: '⏱️' },
    { number: 5, title: 'Review', icon: '✅' }
  ]

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
            <p className="text-sm sm:text-base text-gray-600">Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}</p>
          </div>
        </div>

        {/* Step Progress Indicator */}
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

                  <motion.button
                    type="button"
                    onClick={nextStep}
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

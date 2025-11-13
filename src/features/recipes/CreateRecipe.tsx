import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveRecipe } from '../../services/recipeStorageApi'
import { IngredientInput } from '../../components/IngredientInput'
import type { Recipe, Ingredient } from '../../types/nutrition'

export const CreateRecipe: React.FC = () => {
  const navigate = useNavigate()
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  
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
  const clearFieldError = (fieldName: string, stepNumber: number) => {
    if (fieldErrors[fieldName]) {
      const newErrors = { ...fieldErrors }
      delete newErrors[fieldName]
      setFieldErrors(newErrors)
      const newStepsWithErrors = new Set(stepsWithErrors)
      newStepsWithErrors.delete(stepNumber)
      setStepsWithErrors(newStepsWithErrors)
    }
  }

  // Ingredient handlers
  const addIngredient = () => {
    setIngredients([...ingredients, { quantity: '', unit: '', item: '' }])
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setIngredients(newIngredients)
    
    // Clear ingredients error when user starts adding data
    if (field === 'item' && value.trim()) {
      clearFieldError('ingredients', 2)
    }
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  // Instruction handlers
  const addInstruction = () => {
    setInstructions([...instructions, ''])
  }

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions]
    newInstructions[index] = value
    setInstructions(newInstructions)
    
    // Clear instructions error when user starts adding data
    if (value.trim()) {
      clearFieldError('instructions', 3)
    }
  }

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index))
    }
  }

  // Tag handlers
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
  }

  // Validation function
  const validateForm = (): { isValid: boolean; errors: Record<string, string>; errorSteps: Set<number> } => {
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
  }

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

  const handleCancel = () => {
    navigate('/dashboard/recipes')
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const steps = [
    { number: 1, title: 'Basic Info', icon: '📝' },
    { number: 2, title: 'Ingredients', icon: '🥕' },
    { number: 3, title: 'Instructions', icon: '👨‍🍳' },
    { number: 4, title: 'Review', icon: '✅' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Recipe</h1>
            <p className="text-gray-600">Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}</p>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <button
                type="button"
                onClick={() => goToStep(step.number)}
                className={`flex flex-col items-center space-y-2 ${
                  step.number === currentStep ? 'opacity-100' : step.number < currentStep ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-colors relative ${
                    step.number === currentStep
                      ? 'bg-green-600 text-white shadow-lg'
                      : step.number < currentStep
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  } ${
                    stepsWithErrors.has(step.number) ? 'ring-2 ring-red-500 ring-offset-2' : ''
                  }`}
                >
                  {step.number < currentStep ? '✓' : step.icon}
                  {stepsWithErrors.has(step.number) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  step.number === currentStep ? 'text-gray-900' : stepsWithErrors.has(step.number) ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 4: Preview Mode */}
      {currentStep === 4 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Error message */}
          {saveError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start" role="alert">
              <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error saving recipe</h3>
                <p className="text-sm text-red-700 mt-1">{saveError}</p>
              </div>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Recipe header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {title || 'Untitled Recipe'}
            </h1>
            
            {description && (
              <p className="text-lg text-gray-600 mb-6">{description}</p>
            )}

            {/* Recipe image */}
            {imagePreview && (
              <div className="mb-6">
                <img
                  src={imagePreview}
                  alt={title || 'Recipe'}
                  className="w-full h-96 object-cover rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Recipe meta */}
            <div className="flex flex-wrap gap-6 pb-6 border-b border-gray-200">
              {prepTime && (
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500">Prep Time</div>
                    <div className="font-medium">{prepTime} min</div>
                  </div>
                </div>
              )}
              
              {cookTime && (
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500">Cook Time</div>
                    <div className="font-medium">{cookTime} min</div>
                  </div>
                </div>
              )}

              {servings && (
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500">Servings</div>
                    <div className="font-medium">{servings}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          {ingredients.filter(i => i.item.trim()).length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {ingredients.filter(i => i.item.trim()).map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">
                      {[ingredient.quantity, ingredient.unit, ingredient.item]
                        .filter(p => p.trim())
                        .join(' ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {instructions.filter(i => i.trim()).length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
              <ol className="space-y-4">
                {instructions.filter(i => i.trim()).map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold text-sm mr-4 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 pt-1">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons in preview mode */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saveLoading}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saveLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Steps 1-3: Form */
        <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
                  Basic Information
                </h2>
                
                {/* Recipe Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipe Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      // Clear error when user starts typing
                      if (e.target.value) {
                        clearFieldError('title', 1)
                      }
                    }}
                    required
                    placeholder="e.g., Grandma's Chocolate Chip Cookies"
                    aria-invalid={!!fieldErrors.title}
                    aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      fieldErrors.title
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p id="title-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Brief description of your recipe..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Time and Servings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prep Time (min)
                    </label>
                    <input
                      type="number"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      min="0"
                      placeholder="15"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cook Time (min)
                    </label>
                    <input
                      type="number"
                      value={cookTime}
                      onChange={(e) => setCookTime(e.target.value)}
                      min="0"
                      placeholder="30"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Servings <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                      min="1"
                      required
                      placeholder="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Recipe Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipe Image
                  </label>
                  
                  {!imagePreview ? (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, or WEBP (recommended max size: 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Recipe preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        title="Remove image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Ingredients */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <IngredientInput
                  ingredients={ingredients}
                  onAddIngredient={addIngredient}
                  onUpdateIngredient={updateIngredient}
                  onRemoveIngredient={removeIngredient}
                />
                {fieldErrors.ingredients && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start" role="alert">
                    <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{fieldErrors.ingredients}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Instructions & Tags */}
            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Instructions Section */}
                <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Instructions <span className="text-red-500">*</span>
              </h2>
              <button
                type="button"
                onClick={addInstruction}
                className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Step</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center">
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
                      {index + 1}
                    </span>
                  </span>
                  <textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder="Describe this step in detail..."
                    required={index === 0}
                    rows={2}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {fieldErrors.instructions && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start" role="alert">
                <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{fieldErrors.instructions}</p>
                </div>
              </div>
            )}
                </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
                Tags (Optional)
              </h2>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Add tags (e.g., 'quick', 'healthy', 'vegetarian')"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
              </div>
            )}

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
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saveLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                </button>
              )}
            </div>
          </div>
        </div>
        </form>
      )}
    </div>
  )
}

import React from 'react'
import { IngredientInput } from '../../../components/IngredientInput'
import type { Ingredient } from '../../../types/nutrition'

interface RecipeFormStepsProps {
  currentStep: number
  // Basic Info
  title: string
  setTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  prepTime: string
  setPrepTime: (value: string) => void
  cookTime: string
  setCookTime: (value: string) => void
  servings: string
  setServings: (value: string) => void
  imagePreview: string | null
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: () => void
  // Ingredients
  ingredients: Ingredient[]
  addIngredient: () => void
  updateIngredient: (index: number, field: keyof Ingredient, value: string) => void
  removeIngredient: (index: number) => void
  // Instructions & Tags
  instructions: string[]
  addInstruction: () => void
  updateInstruction: (index: number, value: string) => void
  removeInstruction: (index: number) => void
  tags: string[]
  tagInput: string
  setTagInput: (value: string) => void
  addTag: () => void
  removeTag: (index: number) => void
  // Validation
  fieldErrors: Record<string, string>
  clearFieldError: (fieldName: string, stepNumber: number) => void
}

export const RecipeFormSteps = React.memo<RecipeFormStepsProps>(({
  currentStep,
  title,
  setTitle,
  description,
  setDescription,
  prepTime,
  setPrepTime,
  cookTime,
  setCookTime,
  servings,
  setServings,
  imagePreview,
  handleImageUpload,
  removeImage,
  ingredients,
  addIngredient,
  updateIngredient,
  removeIngredient,
  instructions,
  addInstruction,
  updateInstruction,
  removeInstruction,
  tags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  fieldErrors,
  clearFieldError
}) => {
  return (
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
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
    </div>
  )
})

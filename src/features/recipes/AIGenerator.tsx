import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../../store'
import { generateRecipe, generateImage, clearRecipe, clearImage } from './recipeSlice'
import NutritionFacts from '../../components/NutritionFacts'
import ServingsStepper from '../../components/ServingsStepper'
import { scaleIngredient } from '../../utils/quantityUtils'
import { formatMinutes } from '../../utils/timeUtils'
import { saveRecipe } from '../../services/recipeStorageApi'
import type { Recipe } from '../../types/nutrition'
import type { RootState } from '../../store'

// Common ingredients for autocomplete suggestions
const COMMON_INGREDIENTS = [
  'chicken breast', 'ground beef', 'salmon', 'eggs', 'tofu', 'bacon',
  'milk', 'butter', 'cheddar cheese', 'mozzarella', 'parmesan',
  'onion', 'garlic', 'tomatoes', 'bell pepper', 'carrots', 'broccoli', 'spinach',
  'rice', 'pasta', 'bread', 'flour', 'oats', 'quinoa',
  'olive oil', 'soy sauce', 'chicken broth', 'tomato paste',
  'salt', 'black pepper', 'paprika', 'cumin', 'oregano', 'basil',
  'ketchup', 'mustard', 'mayonnaise', 'hot sauce',
  'lemon', 'lime', 'honey', 'sugar'
].sort()

export const AIGenerator: React.FC = () => {
  const dispatch = useAppDispatch()
  const { loading, result, error, imageUrl, imageLoading, imageError } = useAppSelector((state: RootState) => state.recipe)

  const [prompt, setPrompt] = useState('')
  const [pantryItems, setPantryItems] = useState<string[]>([])
  const [pantryInput, setPantryInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [targetServings, setTargetServings] = useState<number | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const progressRef = useRef<number>(0)

  let parsedRecipe: Recipe | null = null
  if (result) {
    try {
      parsedRecipe = JSON.parse(result)
    } catch (e) {
      console.error('Failed to parse recipe JSON:', e)
      parsedRecipe = null
    }
  }

  // Handler functions
  const handleAddIngredient = (item: string) => {
    if (item.trim() && !pantryItems.includes(item.trim().toLowerCase())) {
      setPantryItems([...pantryItems, item.trim().toLowerCase()])
      setPantryInput('')
      setSuggestions([])
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setPantryItems(pantryItems.filter((_, i) => i !== index))
  }

  const handlePantryInputChange = (value: string) => {
    setPantryInput(value)
    if (value.length > 1) {
      const filtered = COMMON_INGREDIENTS.filter((ing) =>
        ing.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  const toggleDiet = (diet: string) => {
    if (selectedDiets.includes(diet)) {
      setSelectedDiets(selectedDiets.filter((d) => d !== diet))
    } else {
      setSelectedDiets([...selectedDiets, diet])
    }
  }

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(generateRecipe({
      prompt,
      pantryItems,
      dietaryPreferences: selectedDiets.length > 0 ? selectedDiets : undefined
    }))
  }

  const handleClear = () => {
    dispatch(clearRecipe())
    setTargetServings(null)
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleSaveRecipe = async () => {
    if (!parsedRecipe) return

    setSaveLoading(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await saveRecipe(parsedRecipe)
      setSaveSuccess(true)
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      console.error('Failed to save recipe:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save recipe. Please try again.'
      setSaveError(errorMessage)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleGenerateImage = useCallback(() => {
    if (!parsedRecipe) return

    dispatch(generateImage({
      recipe: parsedRecipe
    }))
  }, [parsedRecipe, dispatch])

  const handleClearImage = () => {
    dispatch(clearImage())
  }

  // Progress simulation during loading
  useEffect(() => {
    if (loading) {
      setProgress(5)
      progressRef.current = window.setInterval(() => {
        setProgress((p) => {
          const next = p + Math.random() * (p < 50 ? 8 : p < 80 ? 4 : 1)
          return Math.min(95, Math.round(next))
        })
      }, 400) as unknown as number
    } else {
      setProgress(100)
      if (progressRef.current) {
        window.clearInterval(progressRef.current)
        progressRef.current = 0
      }
    }
  }, [loading])

  // Auto-generate image when recipe is successfully generated
  useEffect(() => {
    if (parsedRecipe && !imageUrl && !imageLoading && !imageError) {
      // Small delay to let the recipe render first
      const timer = setTimeout(() => {
        handleGenerateImage()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [parsedRecipe, imageUrl, imageLoading, imageError, handleGenerateImage])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">AI Recipe Generator</h1>
          <span className="px-3 py-1 text-xs font-semibold text-purple-600 bg-purple-100 rounded-full">
            POWERED BY AI
          </span>
        </div>
        <p className="text-gray-600">Generate custom recipes based on your preferences and ingredients</p>
      </div>

      {!result && (
        <form onSubmit={handleGenerate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Description/Prompt */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What would you like to make? (Optional)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="e.g., 'a quick weeknight dinner', 'something spicy', 'healthy lunch'"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Pantry Items */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Ingredients ({pantryItems.length})
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pantryInput}
                  onChange={(e) => handlePantryInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddIngredient(pantryInput)
                    }
                  }}
                  placeholder="Add ingredients..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddIngredient(sug)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {pantryItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {pantryItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="ml-2 text-amber-600 hover:text-amber-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dietary Preferences */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Dietary Preferences (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Keto'].map((diet) => (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => toggleDiet(diet)}
                    className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${
                      selectedDiets.includes(diet)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Generating... {progress}%</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate Recipe with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Recipe Result */}
      {result && parsedRecipe && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{parsedRecipe.recipeName}</h2>
                {parsedRecipe.description && (
                  <p className="mt-2 text-gray-600">{parsedRecipe.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSaveRecipe}
                  disabled={saveLoading || saveSuccess}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saveLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Save Recipe</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Generate New
                </button>
              </div>
            </div>

            {/* Save Error Message */}
            {saveError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {saveError}
              </div>
            )}

            {/* Recipe Image Section */}
            <div className="mb-6">
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={parsedRecipe.recipeName}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      handleClearImage()
                      // Trigger regeneration after clearing
                      setTimeout(() => handleGenerateImage(), 100)
                    }}
                    className="absolute top-2 right-2 px-3 py-2 bg-white/90 rounded-lg hover:bg-white transition-colors shadow-lg flex items-center space-x-2"
                    title="Regenerate image"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Regenerate</span>
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {imageLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
                      <p className="text-gray-600">Generating image...</p>
                    </div>
                  ) : (
                    <>
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <button
                        onClick={handleGenerateImage}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-md"
                      >
                        Generate Recipe Image
                      </button>
                      {imageError && (
                        <p className="mt-3 text-sm text-red-600">{imageError}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Time and Servings */}
            <div className="flex items-center space-x-6 mb-6 text-sm text-gray-600">
              {parsedRecipe.estimatedTimeMinutes && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatMinutes(parsedRecipe.estimatedTimeMinutes)}</span>
                </div>
              )}
              {parsedRecipe.servings && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{parsedRecipe.servings} servings</span>
                </div>
              )}
            </div>

            {/* Servings Adjuster */}
            {parsedRecipe.servings && (
              <div className="mb-6">
                <ServingsStepper
                  servings={parsedRecipe.servings}
                  targetServings={targetServings}
                  setTargetServings={setTargetServings}
                />
              </div>
            )}

            {/* Ingredients */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-left">
                {parsedRecipe.ingredients?.map((ing, idx) => {
                  const scaledIngredient = targetServings !== null ? scaleIngredient(ing, targetServings / (Number(parsedRecipe.servings) || 1)) : ing
                  return (
                    <li key={idx} className="flex items-start text-left">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-left">{String(scaledIngredient)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Instructions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Instructions</h3>
              <ol className="space-y-4">
                {parsedRecipe.instructions?.map((instruction, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-semibold rounded-full mr-4 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 pt-1">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Nutrition Facts */}
            {parsedRecipe.nutritionalInfo && (
              <div className="mt-8">
                <NutritionFacts
                  nutritionalInfo={parsedRecipe.nutritionalInfo}
                />
              </div>
            )}

            {/* Recipe Tips */}
            {parsedRecipe.tips && (
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Tips & Tricks</h3>
                
                {/* Substitutions */}
                {parsedRecipe.tips.substitutions && parsedRecipe.tips.substitutions.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 mb-2">Ingredient Substitutions</h4>
                        <ul className="space-y-1 text-sm text-amber-800">
                          {parsedRecipe.tips.substitutions.map((sub, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{sub}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Variations */}
                {parsedRecipe.tips.variations && parsedRecipe.tips.variations.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-900 mb-2">Recipe Variations</h4>
                        <ul className="space-y-1 text-sm text-purple-800">
                          {parsedRecipe.tips.variations.map((variation, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{variation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Storage & Make-Ahead */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedRecipe.tips.storage && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-1">Storage</h4>
                          <p className="text-sm text-blue-800">{parsedRecipe.tips.storage}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {parsedRecipe.tips.makeAhead && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-1">Make-Ahead</h4>
                          <p className="text-sm text-green-800">{parsedRecipe.tips.makeAhead}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {parsedRecipe.tips.reheating && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-semibold text-orange-900 mb-1">Reheating</h4>
                          <p className="text-sm text-orange-800">{parsedRecipe.tips.reheating}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

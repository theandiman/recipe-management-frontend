import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../../store'
import { generateRecipe, remixRecipe, generateImage, clearImage } from './recipeSlice'
import { motion } from 'framer-motion'
import ServingsStepper from '../../components/ServingsStepper'
import { scaleIngredient } from '../../utils/quantityUtils'
import { saveRecipe } from '../../services/recipeStorageApi'
import type { Recipe } from '../../types/nutrition'
import type { RootState } from '../../store'
import RecipeBody from './components/RecipeBody'
import { AIRemixToolbar } from './components/AIRemixToolbar'
import { PantryVisionScannerModal } from './components/PantryVisionScannerModal'

export const AIGenerator: React.FC = () => {
  const dispatch = useAppDispatch()
  const { loading, result, error, imageUrl, imageLoading, imageError } = useAppSelector((state: RootState) => state.recipe)

  const [prompt, setPrompt] = useState('')
  const [pantryItems, setPantryItems] = useState<string[]>([])
  const [pantryInput, setPantryInput] = useState('')
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [targetServings, setTargetServings] = useState<number | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isVisionScannerOpen, setIsVisionScannerOpen] = useState(false)
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
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setPantryItems(pantryItems.filter((_, i) => i !== index))
  }

  const handleImportScannedIngredients = (newItems: string[]) => {
    const unique = newItems.map((i) => i.trim().toLowerCase()).filter((item) => item && !pantryItems.includes(item))
    if (unique.length > 0) {
      setPantryItems([...pantryItems, ...unique])
    }
  }

  const handlePantryInputChange = (value: string) => {
    setPantryInput(value)
  }

  const toggleDiet = (diet: string) => {
    if (selectedDiets.includes(diet)) {
      setSelectedDiets(selectedDiets.filter((d) => d !== diet))
    } else {
      setSelectedDiets([...selectedDiets, diet])
    }
  }


  const runRecipeGeneration = () => {
    dispatch(generateRecipe({
      prompt,
      pantryItems,
      dietaryPreferences: selectedDiets.length > 0 ? selectedDiets : undefined
    }))
  }

  const handleRemixRecipe = (instruction: string) => {
    if (!parsedRecipe) return
    dispatch(remixRecipe({
      currentRecipe: parsedRecipe,
      instruction,
    }))
  }

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    runRecipeGeneration()
  }

  const handleSaveRecipe = async () => {
    if (!parsedRecipe) return

    setSaveLoading(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Merge the imageUrl from Redux state into the recipe before saving
      const recipeToSave = {
        ...parsedRecipe,
        imageUrl: imageUrl || parsedRecipe.imageUrl
      }
      
      await saveRecipe(recipeToSave)
      setSaveSuccess(true)
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      console.error('Failed to save recipe:', err)
      const errorMessage = err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : err instanceof Error 
          ? err.message 
          : 'Failed to save recipe. Please try again.'
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Recipe Generator</h1>
          <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">
            POWERED BY AI
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300">Generate custom recipes based on your preferences and ingredients</p>
      </div>

      {!result && (
        <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 sm:p-8">
          <div className="space-y-6">
            {/* Description/Prompt */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                What would you like to make? (Optional)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="e.g., 'a quick weeknight dinner', 'something spicy', 'healthy lunch'"
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Pantry Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Available Ingredients ({pantryItems.length})
                </label>
                <button
                  type="button"
                  onClick={() => setIsVisionScannerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>📷</span>
                  <span>Scan Fridge / Pantry</span>
                </button>
              </div>
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              {pantryItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {pantryItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm rounded-full"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="ml-2 text-amber-600 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
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
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/40 rounded-lg text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
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
              </motion.button>
            </div>
          </div>
        </form>
      )}

      {/* Recipe Result */}
      {result && parsedRecipe && (
        <div className="space-y-6">
          {/* AI Recipe Remix & Tweak Toolbar */}
          <AIRemixToolbar
            recipe={parsedRecipe}
            isLoading={loading}
            onRemix={handleRemixRecipe}
          />

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{parsedRecipe.recipeName}</h2>
                {parsedRecipe.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{parsedRecipe.description}</p>
                )}
                {saveSuccess && (
                  <span className="inline-block mt-2 text-sm text-emerald-700 font-medium">✓ Saved to library</span>
                )}
                {saveError && (
                  <span className="inline-block mt-2 text-sm text-red-600 font-medium">✗ {saveError}</span>
                )}
              </div>
              
              {/* Action buttons in top-right */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSaveRecipe}
                  disabled={saveLoading || saveSuccess}
                  aria-label="Save to library"
                  title="Save to library"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saveLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Save</span>
                    </>
                  )}
                </button>

                <button
                  onClick={runRecipeGeneration}
                  disabled={loading}
                  aria-label="Regenerate recipe"
                  title="Regenerate recipe"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-gray-200" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Regenerate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recipe Image Section */}
            <div className="mb-6">
              {imageUrl ? (
                <figure className="relative" aria-label={`${parsedRecipe.recipeName} image with regenerate option`}>
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt={parsedRecipe.recipeName}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                  <button
                    onClick={() => {
                      handleClearImage()
                      // Trigger regeneration after clearing
                      setTimeout(() => handleGenerateImage(), 100)
                    }}
                    disabled={imageLoading}
                    aria-label="Regenerate image"
                    title="Regenerate image"
                    className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 h-10 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors disabled:opacity-50"
                  >
                    {imageLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    <span className="sr-only sm:not-sr-only text-xs">Regenerate</span>
                  </button>
                </figure>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-slate-900">
                  {imageLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4" />
                      <p className="text-gray-600 dark:text-gray-300 font-medium">Generating recipe image...</p>
                    </div>
                  ) : (
                    <>
                      <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <button
                        onClick={handleGenerateImage}
                        className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 transform hover:scale-105"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Generate Recipe Image</span>
                      </button>
                      {imageError && (
                        <p className="mt-4 text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-lg inline-block">{imageError}</p>
                      )}
                    </>
                  )}
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

            <RecipeBody
              recipe={
                targetServings !== null && parsedRecipe.ingredients
                  ? {
                      ...parsedRecipe,
                      ingredients: parsedRecipe.ingredients.map((ing: string) =>
                        String(scaleIngredient(ing, targetServings / (Number(parsedRecipe.servings) || 1)))
                      ),
                    }
                  : parsedRecipe
              }
            />
          </div>
        </div>
      )}

      {/* Pantry Vision AI Scanner Modal */}
      <PantryVisionScannerModal
        isOpen={isVisionScannerOpen}
        onClose={() => setIsVisionScannerOpen(false)}
        onImportIngredients={handleImportScannedIngredients}
      />
    </div>
  )
}

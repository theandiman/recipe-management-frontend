import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecipe } from '../../services/recipeStorageApi'
import { RecipeFormLayout } from './components/RecipeFormLayout'
import { useRecipeForm } from './hooks/useRecipeForm'
import { useRecipeValidation } from './hooks/useRecipeValidation'
import { useRecipeFormNavigation } from './hooks/useRecipeFormNavigation'
import { useRecipeSave } from './hooks/useRecipeSave'
import type { Recipe } from '../../types/nutrition'
import { useAuth } from '../../features/auth/AuthContext'

export const EditRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser, isLoading: isAuthLoading } = useAuth()
  
  // Loading state
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [recipeOverrides, setRecipeOverrides] = useState<Partial<Recipe>>({})
  
  // Use custom hooks
  const navigation = useRecipeFormNavigation()
  const form = useRecipeForm()
  const { validateForm, buildRecipeObject } = useRecipeValidation()

  const currentTips = useMemo(() => {
    const storage = form.storageInstructions?.trim()
    const makeAhead = form.makeAheadTips?.trim()
    const reheating = form.reheatingInstructions?.trim()
    const substitutions = form.substitutions?.length ? form.substitutions : undefined
    const variations = form.variations?.length ? form.variations : undefined

    if (!storage && !makeAhead && !reheating && !substitutions && !variations) {
      return undefined
    }

    return {
      ...(storage && { storage }),
      ...(makeAhead && { makeAhead }),
      ...(reheating && { reheating }),
      ...(substitutions && { substitutions }),
      ...(variations && { variations }),
    }
  }, [form.storageInstructions, form.makeAheadTips, form.reheatingInstructions, form.substitutions, form.variations])

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
    dietaryRestrictions: form.dietaryRestrictions,
    imagePreview: form.imagePreview,
    recipeOverrides: {
      ...recipeOverrides,
      tips: currentTips,
    },
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

      // Wait for Firebase auth to finish initialising before fetching the recipe.
      // Otherwise we could fetch, populate the form, or redirect while
      // currentUser is still temporarily null during auth resolution.
      if (isAuthLoading) return
      
      try {
        setLoading(true)
        setLoadError(null)
        const data = await getRecipe(id)

        if (data.userId !== currentUser?.uid) {
          navigate(`/dashboard/recipes/${id}`, { replace: true })
          return
        }
        
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
        form.setDietaryRestrictions(data.dietaryRestrictions || [])
        form.setImagePreview(data.imageUrl || null)
        const tips = (data.tips || {}) as Record<string, unknown>
        const raw = data as unknown as Record<string, unknown>

        const storage = tips.storage || tips.storageInstructions || raw.storage || raw.storageInstructions
        const makeAhead = tips.makeAhead || tips.makeAheadTips || raw.makeAhead || raw.makeAheadTips
        const reheating = tips.reheating || tips.reheatingInstructions || raw.reheating || raw.reheatingInstructions
        const substitutions = tips.substitutions || tips.ingredientSubstitutions || raw.substitutions || raw.ingredientSubstitutions
        const variations = tips.variations || tips.recipeVariations || raw.variations || raw.recipeVariations

        if (typeof storage === 'string' && storage) form.setStorageInstructions(storage)
        if (typeof makeAhead === 'string' && makeAhead) form.setMakeAheadTips(makeAhead)
        if (typeof reheating === 'string' && reheating) form.setReheatingInstructions(reheating)
        if (Array.isArray(substitutions)) form.setSubstitutions(substitutions)
        if (Array.isArray(variations)) form.setVariations(variations)
        setRecipeOverrides({
          nutritionalInfo: data.nutritionalInfo,
          tips: data.tips,
          source: data.source,
        })
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
  }, [id, navigate, isAuthLoading, currentUser?.uid, form.setTitle, form.setDescription, form.setPrepTime, form.setCookTime, form.setServings, form.setIngredients, form.setInstructions, form.setTags, form.setDietaryRestrictions, form.setImagePreview])

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
      {...navigation}
      canGoNext={!navigation.isLastStep}
      canGoPrevious={!navigation.isFirstStep}
      {...form}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  )
}

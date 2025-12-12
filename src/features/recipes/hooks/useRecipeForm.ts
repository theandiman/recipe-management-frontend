import { useState, useCallback, useMemo } from 'react'
import type { Ingredient } from '../../../types/nutrition'

interface RecipeFormState {
  // Form fields
  title: string
  description: string
  prepTime: string
  cookTime: string
  servings: string
  ingredients: Ingredient[]
  instructions: string[]
  tags: string[]
  tagInput: string
  imagePreview: string | null
  
  // Validation state
  fieldErrors: Record<string, string>
  stepsWithErrors: Set<number>
  
  // Save state
  saveLoading: boolean
  saveError: string | null
}

interface RecipeFormActions {
  // Setters
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setPrepTime: (value: string) => void
  setCookTime: (value: string) => void
  setServings: (value: string) => void
  setIngredients: (value: Ingredient[]) => void
  setInstructions: (value: string[]) => void
  setTags: (value: string[]) => void
  setTagInput: (value: string) => void
  setImagePreview: (value: string | null) => void
  setFieldErrors: (value: Record<string, string>) => void
  setStepsWithErrors: (value: Set<number>) => void
  setSaveLoading: (value: boolean) => void
  setSaveError: (value: string | null) => void
  
  // Ingredient handlers
  addIngredient: () => void
  updateIngredient: (index: number, field: keyof Ingredient, value: string) => void
  removeIngredient: (index: number) => void
  
  // Instruction handlers
  addInstruction: () => void
  updateInstruction: (index: number, value: string) => void
  removeInstruction: (index: number) => void
  
  // Tag handlers
  addTag: () => void
  removeTag: (index: number) => void
  
  // Image handlers
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: () => void
  
  // Helpers
  clearFieldError: (fieldName: string, stepNumber: number) => void
}

export function useRecipeForm(initialState?: Partial<RecipeFormState>): RecipeFormState & RecipeFormActions {
  // Form state
  const [title, setTitle] = useState(initialState?.title || '')
  const [description, setDescription] = useState(initialState?.description || '')
  const [prepTime, setPrepTime] = useState(initialState?.prepTime || '')
  const [cookTime, setCookTime] = useState(initialState?.cookTime || '')
  const [servings, setServings] = useState(initialState?.servings || '')
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialState?.ingredients || [{ quantity: '', unit: '', item: '' }]
  )
  const [instructions, setInstructions] = useState<string[]>(initialState?.instructions || [''])
  const [tags, setTags] = useState<string[]>(initialState?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(initialState?.imagePreview || null)

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(initialState?.fieldErrors || {})
  const [stepsWithErrors, setStepsWithErrors] = useState<Set<number>>(
    initialState?.stepsWithErrors || new Set()
  )

  // Save state
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Helper function to clear field errors
  const clearFieldError = useCallback((fieldName: string, stepNumber: number) => {
    setFieldErrors(prev => {
      if (prev[fieldName]) {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      }
      return prev
    })
    setStepsWithErrors(prev => {
      const newSet = new Set(prev)
      newSet.delete(stepNumber)
      return newSet
    })
  }, [])

  // Ingredient handlers
  const addIngredient = useCallback(() => {
    setIngredients(prev => [...prev, { quantity: '', unit: '', item: '' }])
  }, [])

  const updateIngredient = useCallback((index: number, field: keyof Ingredient, value: string) => {
    setIngredients(prev => {
      const newIngredients = [...prev]
      newIngredients[index] = { ...newIngredients[index], [field]: value }
      return newIngredients
    })
    
    // Clear ingredients error when user starts adding data
    if (field === 'item' && value.trim()) {
      clearFieldError('ingredients', 2)
    }
  }, [clearFieldError])

  const removeIngredient = useCallback((index: number) => {
    setIngredients(prev => {
      if (prev.length > 1) {
        const newIngredients = prev.filter((_, i) => i !== index)
        
        // Re-validate ingredients after removal
        const hasValidIngredient = newIngredients.some(ing => ing.item.trim())
        if (!hasValidIngredient) {
          setFieldErrors(errors => ({ ...errors, ingredients: 'At least one ingredient is required' }))
          setStepsWithErrors(steps => new Set(steps).add(2))
        }
        
        return newIngredients
      }
      return prev
    })
  }, [])

  // Instruction handlers
  const addInstruction = useCallback(() => {
    setInstructions(prev => [...prev, ''])
  }, [])

  const updateInstruction = useCallback((index: number, value: string) => {
    setInstructions(prev => {
      const newInstructions = [...prev]
      newInstructions[index] = value
      return newInstructions
    })
    
    // Clear instructions error when user starts adding data
    if (value.trim()) {
      clearFieldError('instructions', 3)
    }
  }, [clearFieldError])

  const removeInstruction = useCallback((index: number) => {
    setInstructions(prev => {
      if (prev.length > 1) {
        const newInstructions = prev.filter((_, i) => i !== index)
        
        // Re-validate instructions after removal
        const hasValidInstruction = newInstructions.some(inst => inst.trim())
        if (!hasValidInstruction) {
          setFieldErrors(errors => ({ ...errors, instructions: 'At least one instruction is required' }))
          setStepsWithErrors(steps => new Set(steps).add(3))
        }
        
        return newInstructions
      }
      return prev
    })
  }, [])

  // Tag handlers
  const addTag = useCallback(() => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag])
      setTagInput('')
    }
  }, [tagInput, tags])

  const removeTag = useCallback((index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index))
  }, [])

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

  return useMemo(() => ({
    // State
    title,
    description,
    prepTime,
    cookTime,
    servings,
    ingredients,
    instructions,
    tags,
    tagInput,
    imagePreview,
    fieldErrors,
    stepsWithErrors,
    saveLoading,
    saveError,
    
    // Setters
    setTitle,
    setDescription,
    setPrepTime,
    setCookTime,
    setServings,
    setIngredients,
    setInstructions,
    setTags,
    setTagInput,
    setImagePreview,
    setFieldErrors,
    setStepsWithErrors,
    setSaveLoading,
    setSaveError,
    
    // Handlers
    addIngredient,
    updateIngredient,
    removeIngredient,
    addInstruction,
    updateInstruction,
    removeInstruction,
    addTag,
    removeTag,
    handleImageUpload,
    removeImage,
    clearFieldError
  }), [
    title, description, prepTime, cookTime, servings, ingredients, instructions, tags, tagInput, imagePreview, fieldErrors, stepsWithErrors, saveLoading, saveError,
    addIngredient, updateIngredient, removeIngredient, addInstruction, updateInstruction, removeInstruction, addTag, removeTag, handleImageUpload, removeImage, clearFieldError
  ])
}

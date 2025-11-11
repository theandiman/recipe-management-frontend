import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const CreateRecipe: React.FC = () => {
  const navigate = useNavigate()
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [prepTime, setPrepTime] = useState<string>('')
  const [cookTime, setCookTime] = useState<string>('')
  const [servings, setServings] = useState<string>('')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [instructions, setInstructions] = useState<string[]>([''])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Ingredient handlers
  const addIngredient = () => {
    setIngredients([...ingredients, ''])
  }

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = value
    setIngredients(newIngredients)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement save functionality
    console.log({
      title,
      description,
      prepTime: prepTime ? parseInt(prepTime) : undefined,
      cookTime: cookTime ? parseInt(cookTime) : undefined,
      servings: servings ? parseInt(servings) : undefined,
      ingredients: ingredients.filter(i => i.trim()),
      instructions: instructions.filter(i => i.trim()),
      tags
    })
  }

  const handleCancel = () => {
    navigate('/dashboard/recipes')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Recipe</h1>
        <p className="text-gray-600">Add a new recipe to your collection</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-8">
          {/* Basic Info Section */}
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
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., Grandma's Chocolate Chip Cookies"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
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
          </div>

          {/* Ingredients Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Ingredients <span className="text-red-500">*</span>
              </h2>
              <button
                type="button"
                onClick={addIngredient}
                className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Ingredient</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    placeholder="e.g., 2 cups all-purpose flour"
                    required={index === 0}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
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
          </div>

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

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors shadow-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Recipe</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

import React from 'react'

interface RecipePreviewProps {
  title: string
  description: string
  prepTime: string
  cookTime: string
  servings: string
  ingredients: Array<{
    quantity: string
    unit: string
    item: string
  }>
  instructions: string[]
  tags: string[]
  imagePreview: string | null
  saveError: string | null
  setSaveError: (error: string | null) => void
  handleSubmit: (e: React.FormEvent) => void
  handleCancel: () => void
  prevStep: () => void
  saveLoading: boolean
}

export const RecipePreview: React.FC<RecipePreviewProps> = ({
  title,
  description,
  prepTime,
  cookTime,
  servings,
  ingredients,
  instructions,
  tags,
  imagePreview,
  saveError,
  setSaveError,
  handleSubmit,
  handleCancel,
  prevStep,
  saveLoading
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {/* Error message */}
      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start" role="alert">
          <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
  )
}
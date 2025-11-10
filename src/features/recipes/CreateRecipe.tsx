import React from 'react'

export const CreateRecipe: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Recipe</h1>
        <p className="text-gray-600">Add a new recipe to your collection</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form className="space-y-6">
          {/* Recipe Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recipe Name
            </label>
            <input
              type="text"
              placeholder="e.g., Grandma's Chocolate Chip Cookies"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of your recipe..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Time and Servings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                placeholder="15"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Servings
              </label>
              <input
                type="number"
                placeholder="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ingredients
            </label>
            <textarea
              rows={6}
              placeholder="1 cup flour&#10;2 eggs&#10;1/2 cup sugar..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              rows={8}
              placeholder="1. Preheat oven to 350°F&#10;2. Mix dry ingredients..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-sm"
            >
              Save Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React from 'react'

export const AIGenerator: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">AI Recipe Generator</h1>
          <span className="px-3 py-1 text-xs font-semibold text-purple-600 bg-purple-100 rounded-full">
            POWERED BY AI
          </span>
        </div>
        <p className="text-gray-600">Generate custom recipes based on your preferences and ingredients</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Generation Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What would you like to create?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">From Ingredients</div>
                    <div className="text-sm text-gray-600">Use what you have</div>
                  </div>
                </div>
              </button>
              <button className="p-4 border-2 border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Surprise Me</div>
                    <div className="text-sm text-gray-600">Random inspiration</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Ingredients Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Available Ingredients
            </label>
            <textarea
              rows={4}
              placeholder="Enter ingredients you have (one per line or comma-separated)&#10;e.g., chicken, rice, tomatoes, garlic"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
                  className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cuisine Type (Optional)
            </label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Any Cuisine</option>
              <option>Italian</option>
              <option>Mexican</option>
              <option>Asian</option>
              <option>Mediterranean</option>
              <option>American</option>
              <option>French</option>
              <option>Indian</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Instructions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Any special requests or constraints? (e.g., 'quick and easy', 'kid-friendly', 'spicy')"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Generate Button */}
          <div className="pt-6 border-t border-gray-200">
            <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Generate Recipe with AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How it works</p>
            <p>Our AI analyzes your ingredients and preferences to create personalized recipes. Each recipe is unique and tailored to your needs!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

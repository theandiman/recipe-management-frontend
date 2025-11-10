import React from 'react'

export const Preferences: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Preferences</h1>
        <p className="text-gray-600">Customize your recipe experience</p>
      </div>

      <div className="space-y-6">
        {/* Dietary Restrictions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dietary Restrictions</h2>
          <div className="space-y-3">
            {[
              { label: 'Vegetarian', description: 'No meat or fish' },
              { label: 'Vegan', description: 'No animal products' },
              { label: 'Gluten-Free', description: 'No gluten-containing grains' },
              { label: 'Dairy-Free', description: 'No milk or dairy products' },
              { label: 'Nut-Free', description: 'No tree nuts or peanuts' },
            ].map((item) => (
              <label key={item.label} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Food Allergies</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Peanuts', 'Tree Nuts', 'Shellfish', 'Soy', 'Eggs'].map((allergy) => (
              <span
                key={allergy}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200 flex items-center space-x-2"
              >
                <span>{allergy}</span>
                <button className="hover:bg-red-200 rounded-full p-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add allergy</span>
          </button>
        </div>

        {/* Favorite Cuisines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Favorite Cuisines</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'French', 'Indian', 'Thai', 'Japanese'].map((cuisine) => (
              <button
                key={cuisine}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{cuisine}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cooking Skill Level */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cooking Skill Level</h2>
          <div className="space-y-2">
            {[
              { level: 'Beginner', description: 'Simple recipes with basic techniques' },
              { level: 'Intermediate', description: 'Moderate complexity recipes' },
              { level: 'Advanced', description: 'Complex recipes and techniques' },
            ].map((item) => (
              <label key={item.level} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="skill"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{item.level}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Reset to Defaults
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-sm">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}

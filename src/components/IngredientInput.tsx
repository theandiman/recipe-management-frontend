import React from 'react'
import type { Ingredient } from '../types/nutrition'

interface IngredientInputProps {
  ingredients: Ingredient[]
  onAddIngredient: () => void
  onUpdateIngredient: (index: number, field: keyof Ingredient, value: string) => void
  onRemoveIngredient: (index: number) => void
}

const COMMON_UNITS = [
  '',
  'tsp',
  'tbsp',
  'cup',
  'cups',
  'ml',
  'l',
  'oz',
  'g',
  'kg',
  'lb',
  'lbs',
  'pinch',
  'dash',
  'slice',
  'clove',
  'can',
  'jar',
  'pack',
  'whole'
]

export const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onRemoveIngredient,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Ingredients <span className="text-red-500">*</span>
        </h2>
        <button
          type="button"
          onClick={onAddIngredient}
          className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Ingredient</span>
        </button>
      </div>

      <div className="space-y-3">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-3 px-1 mb-2">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">Qty</label>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">Unit</label>
          </div>
          <div className="col-span-7">
            <label className="text-xs font-semibold text-gray-600 uppercase">Item</label>
          </div>
          <div className="col-span-1" />
        </div>

        {/* Ingredient rows */}
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex items-center gap-3 group">
            {/* Quantity Input */}
            <div className="w-16 flex-shrink-0">
              <input
                type="text"
                value={ingredient.quantity}
                onChange={(e) => onUpdateIngredient(index, 'quantity', e.target.value)}
                placeholder="1"
                required={index === 0}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Unit Dropdown */}
            <div className="w-20 flex-shrink-0">
              <select
                value={ingredient.unit}
                onChange={(e) => onUpdateIngredient(index, 'unit', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
              >
                {COMMON_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit || 'none'}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Input */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={ingredient.item}
                onChange={(e) => onUpdateIngredient(index, 'item', e.target.value)}
                placeholder="e.g., all-purpose flour"
                required={index === 0}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Delete Button */}
            {ingredients.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveIngredient(index)}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Remove ingredient"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Help text */}
      <p className="text-sm text-gray-500 italic mt-4">
        💡 Use standard measurements (tsp, tbsp, cup, g, etc.) for better consistency when scaling recipes
      </p>
    </div>
  )
}

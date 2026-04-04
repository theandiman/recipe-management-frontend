import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Ingredients <span className="text-rose-500">*</span>
        </h2>
        <button
          type="button"
          onClick={onAddIngredient}
          className="px-4 py-2 text-sm font-medium bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Ingredient</span>
        </button>
      </div>

      <div className="space-y-3">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-3 px-2 mb-2">
          <div className="col-span-3 sm:col-span-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</label>
          </div>
          <div className="col-span-4 sm:col-span-3">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</label>
          </div>
          <div className="col-span-5 sm:col-span-6">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</label>
          </div>
          <div className="col-span-1" />
        </div>

        {/* Ingredient rows */}
        <AnimatePresence initial={false}>
          {ingredients.map((ingredient, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95, overflow: 'hidden' }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 sm:gap-3 group bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-none"
            >
              {/* Quantity Input */}
              <div className="w-14 sm:w-16 flex-shrink-0">
                <input
                  type="text"
                  value={ingredient.quantity}
                  onChange={(e) => onUpdateIngredient(index, 'quantity', e.target.value)}
                  placeholder="1"
                  required={index === 0}
                  className="w-full px-2 sm:px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-sm transition-colors text-center font-medium"
                />
              </div>

              {/* Unit Dropdown */}
              <div className="w-20 sm:w-24 flex-shrink-0">
                <select
                  value={ingredient.unit}
                  onChange={(e) => onUpdateIngredient(index, 'unit', e.target.value)}
                  className="w-full px-2 sm:px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-sm transition-colors appearance-none"
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
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-sm transition-colors font-medium"
                />
              </div>

              {/* Delete Button */}
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveIngredient(index)}
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  title="Remove ingredient"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Help text */}
      <p className="text-sm text-gray-500 italic mt-4">
        💡 Use standard measurements (tsp, tbsp, cup, g, etc.) for better consistency when scaling recipes
      </p>
    </div>
  )
}

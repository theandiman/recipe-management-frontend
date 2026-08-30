import React, { useState } from 'react'
import type { Recipe } from '../../../types/nutrition'

interface AIRemixToolbarProps {
  recipe: Recipe
  isLoading: boolean
  onRemix: (instruction: string) => void
}

const PRESET_REMIXES = [
  { label: '🌶️ Make it Spicier', instruction: 'Make this recipe spicier with extra chili or hot peppers' },
  { label: '⏱️ Make it Quicker', instruction: 'Simplify and shorten prep/cook time under 20 minutes' },
  { label: '🌱 Make it Vegan', instruction: 'Substitute all animal products with plant-based alternatives' },
  { label: '🥦 Add Extra Veggies', instruction: 'Incorporate extra fresh healthy vegetables into the recipe' },
  { label: '💪 Increase Protein', instruction: 'Boost protein content with extra lean protein sources' },
]

export const AIRemixToolbar: React.FC<AIRemixToolbarProps> = ({
  recipe,
  isLoading,
  onRemix,
}) => {
  const [customInstruction, setCustomInstruction] = useState('')

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customInstruction.trim() || isLoading) return
    onRemix(customInstruction.trim())
    setCustomInstruction('')
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">✨</span>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            AI Recipe Remix & Tweaks
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Instantly refine "{recipe.recipeName}" with 1-click AI adjustments or custom instructions.
          </p>
        </div>
      </div>

      {/* Preset Action Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_REMIXES.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={isLoading}
            onClick={() => onRemix(item.instruction)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Custom Instruction Input */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customInstruction}
          onChange={(e) => setCustomInstruction(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., Use coconut milk instead of cream, or make it gluten-free..."
          className="flex-1 px-3.5 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs"
        />
        <button
          type="submit"
          disabled={!customInstruction.trim() || isLoading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <span>✨</span>
          <span>Remix</span>
        </button>
      </form>
    </div>
  )
}

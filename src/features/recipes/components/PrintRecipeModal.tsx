import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Recipe } from '../../../types/nutrition'
import { PrintableRecipeCard } from './PrintableRecipeCard'
import { getEffectiveTips } from './RecipeBody'

export interface PrintRecipeModalProps {
  recipe: Recipe
  isOpen: boolean
  onClose: () => void
  authorName?: string
  rating?: number
  ratingCount?: number
  onConfigChange?: (config: {
    servings: number
    includePhoto: boolean
    includeNutrition: boolean
    includeTips: boolean
    includeNotesArea: boolean
  }) => void
}

export const PrintRecipeModal: React.FC<PrintRecipeModalProps> = ({
  recipe,
  isOpen,
  onClose,
  authorName,
  rating,
  ratingCount,
  onConfigChange,
}) => {
  const baseServings = typeof recipe.servings === 'number' && recipe.servings > 0 ? recipe.servings : 4
  const [servings, setServings] = useState<number>(baseServings)
  const [includePhoto, setIncludePhoto] = useState<boolean>(Boolean(recipe.imageUrl))
  const [includeNutrition, setIncludeNutrition] = useState<boolean>(Boolean(recipe.nutritionalInfo?.perServing))
  const [includeTips, setIncludeTips] = useState<boolean>(Boolean(getEffectiveTips(recipe)))
  const [includeNotesArea, setIncludeNotesArea] = useState<boolean>(true)

  React.useEffect(() => {
    setServings(baseServings)
    setIncludePhoto(Boolean(recipe.imageUrl))
    setIncludeNutrition(Boolean(recipe.nutritionalInfo?.perServing))
    setIncludeTips(Boolean(getEffectiveTips(recipe)))
    setIncludeNotesArea(true)
  }, [recipe.id, baseServings, recipe.imageUrl, recipe.nutritionalInfo?.perServing])

  React.useEffect(() => {
    onConfigChange?.({
      servings,
      includePhoto,
      includeNutrition,
      includeTips,
      includeNotesArea,
    })
  }, [servings, includePhoto, includeNutrition, includeTips, includeNotesArea, onConfigChange])

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="print-recipe-modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto print:hidden"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-5xl bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[92vh] z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                  🖨️
                </div>
                <div>
                  <h2 id="print-modal-title" className="text-lg font-bold text-white">
                    Print Recipe
                  </h2>
                  <p className="text-xs text-slate-400">
                    Customize your kitchen-ready printout for paper and clipboards
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print Now</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close print dialog"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Left controls panel + Right live print preview */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Controls Column (4 cols) */}
              <div className="lg:col-span-4 p-5 sm:p-6 space-y-6 bg-slate-900/50">
                {/* Servings Scaler */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Servings Scaler
                    </label>
                    {servings !== baseServings && (
                      <button
                        type="button"
                        onClick={() => setServings(baseServings)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Reset ({baseServings})
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 rounded-xl p-2 justify-between">
                    <button
                      type="button"
                      onClick={() => setServings((s) => Math.max(1, s - 1))}
                      disabled={servings <= 1}
                      aria-label="Decrease servings"
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="font-bold text-base text-white">
                      {servings} {servings === 1 ? 'serving' : 'servings'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setServings((s) => s + 1)}
                      aria-label="Increase servings"
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ingredient quantities scale automatically on your printout.
                  </p>
                </div>

                {/* Printout Options Toggles */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                    Print Options
                  </label>

                  {/* Photo toggle */}
                  {recipe.imageUrl && (
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-colors cursor-pointer">
                      <div className="pr-3">
                        <span className="text-xs font-semibold text-white block">
                          Include photo
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Uncheck to save printer ink
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={includePhoto}
                        onChange={(e) => setIncludePhoto(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                  )}

                  {/* Nutrition toggle */}
                  {recipe.nutritionalInfo?.perServing && (
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-colors cursor-pointer">
                      <div className="pr-3">
                        <span className="text-xs font-semibold text-white block">
                          Include nutrition
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Compact calories &amp; macros row
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeNutrition}
                        onChange={(e) => setIncludeNutrition(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                  )}

                  {/* Tips & Storage toggle */}
                  {Boolean(getEffectiveTips(recipe)) && (
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-colors cursor-pointer">
                      <div className="pr-3">
                        <span className="text-xs font-semibold text-white block">
                          Include tips
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Substitutions &amp; storage guide
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeTips}
                        onChange={(e) => setIncludeTips(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                  )}

                  {/* Notes lines toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-colors cursor-pointer">
                    <div className="pr-3">
                      <span className="text-xs font-semibold text-white block">
                        Include cook&apos;s notes
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Lined area for handwritten tweaks
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeNotesArea}
                      onChange={(e) => setIncludeNotesArea(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Live Preview Column (8 cols) */}
              <div className="lg:col-span-8 p-4 sm:p-6 bg-slate-950/60 overflow-y-auto">
                <div className="text-center mb-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                    Live Print Preview
                  </span>
                </div>

                {/* Simulated Paper Sheet */}
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300">
                  <PrintableRecipeCard
                    recipe={recipe}
                    servings={servings}
                    includePhoto={includePhoto}
                    includeNutrition={includeNutrition}
                    includeTips={includeTips}
                    includeNotesArea={includeNotesArea}
                    authorName={authorName}
                    rating={rating}
                    ratingCount={ratingCount}
                    isPrintPreview={true}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-800 bg-slate-900/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>🖨️</span>
                <span>Print Now</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import React from 'react'
import { UI_STYLES } from '../../../utils/uiStyles'
import type { RecipeTips } from '../../../types/nutrition'

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
  tips?: RecipeTips
  imagePreview: string | null
  saveError: string | null
  setSaveError: (error: string | null) => void
  handleSubmit: (e: React.FormEvent) => void
  handleCancel: () => void
  prevStep: () => void
  saveLoading: boolean
}

export const RecipePreview = React.memo<RecipePreviewProps>(({
  title,
  description,
  prepTime,
  cookTime,
  servings,
  ingredients,
  instructions,
  tags,
  tips,
  imagePreview,
  saveError,
  setSaveError,
  handleSubmit,
  handleCancel,
  prevStep,
  saveLoading
}) => {
  return (
    <div className={`${UI_STYLES.surfaceCard} p-8`}>
      {/* Error message */}
      {saveError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/40 rounded-lg flex items-start" role="alert">
          <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error saving recipe</h3>
            <p className="text-sm text-red-700 dark:text-red-300/90 mt-1">{saveError}</p>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="ml-3 text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 transition-colors"
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
        <h1 className={`text-4xl font-bold mb-4 ${UI_STYLES.heading}`}>
          {title || 'Untitled Recipe'}
        </h1>

        {description && (
        <p className={`text-lg mb-6 ${UI_STYLES.mutedText}`}>{description}</p>
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
        <div className="flex flex-wrap gap-6 pb-6 border-b border-gray-200 dark:border-slate-700">
          {prepTime && (
            <div className="flex items-center text-gray-700 dark:text-gray-200">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Prep Time</div>
                <div className="font-medium">{prepTime} min</div>
              </div>
            </div>
          )}

          {cookTime && (
            <div className="flex items-center text-gray-700 dark:text-gray-200">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Cook Time</div>
                <div className="font-medium">{cookTime} min</div>
              </div>
            </div>
          )}

          {servings && (
            <div className="flex items-center text-gray-700 dark:text-gray-200">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Servings</div>
                <div className="font-medium">{servings}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      {ingredients.filter(i => i.item.trim()).length > 0 && (
        <div className="mt-8">
          <h2 className={`text-2xl font-bold mb-4 ${UI_STYLES.heading}`}>Ingredients</h2>
          <ul className="space-y-2">
            {ingredients.filter(i => i.item.trim()).map((ingredient, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 mr-3 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-200">
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
          <h2 className={`text-2xl font-bold mb-4 ${UI_STYLES.heading}`}>Instructions</h2>
          <ol className="space-y-4">
            {instructions.filter(i => i.trim()).map((instruction, index) => (
              <li key={index} className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm mr-4 flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-gray-700 dark:text-gray-200 pt-1">{instruction}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips & Tricks */}
      {tips && (tips.substitutions?.length || tips.variations?.length || tips.storage || tips.makeAhead || tips.reheating) ? (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${UI_STYLES.heading}`}>
            <span>💡</span> Tips &amp; Tricks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.substitutions && tips.substitutions.length > 0 && (
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-200/60 dark:border-amber-800/40">
                  <span className="text-sm">🔄</span>
                  <h3 className="font-bold text-amber-950 dark:text-amber-200 text-sm">Ingredient Substitutions</h3>
                </div>
                <ul className="space-y-1.5">
                  {tips.substitutions.map((sub, idx) => (
                    <li key={idx} className="text-xs text-amber-950/90 dark:text-amber-300/90 flex items-start gap-2 leading-relaxed">
                      <span className="font-bold">•</span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tips.variations && tips.variations.length > 0 && (
              <div className="bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-purple-200/60 dark:border-purple-800/40">
                  <span className="text-sm">✨</span>
                  <h3 className="font-bold text-purple-950 dark:text-purple-200 text-sm">Recipe Variations</h3>
                </div>
                <ul className="space-y-1.5">
                  {tips.variations.map((variation, idx) => (
                    <li key={idx} className="text-xs text-purple-950/90 dark:text-purple-300/90 flex items-start gap-2 leading-relaxed">
                      <span className="font-bold">•</span>
                      <span>{variation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tips.storage && (
              <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/40 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-sky-200/60 dark:border-sky-800/40">
                  <span className="text-sm">📦</span>
                  <h3 className="font-bold text-sky-950 dark:text-sky-200 text-sm">Storage Instructions</h3>
                </div>
                <p className="text-xs text-sky-950/90 dark:text-sky-300/90 leading-relaxed">{tips.storage}</p>
              </div>
            )}
            {tips.makeAhead && (
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-sm">⏰</span>
                  <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">Make-Ahead Tips</h3>
                </div>
                <p className="text-xs text-emerald-950/90 dark:text-emerald-300/90 leading-relaxed">{tips.makeAhead}</p>
              </div>
            )}
            {tips.reheating && (
              <div className="bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/40 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-orange-200/60 dark:border-orange-800/40">
                  <span className="text-sm">🔥</span>
                  <h3 className="font-bold text-orange-950 dark:text-orange-200 text-sm">Reheating Instructions</h3>
                </div>
                <p className="text-xs text-orange-950/90 dark:text-orange-300/90 leading-relaxed">{tips.reheating}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Action buttons in preview mode */}
      <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200 dark:border-slate-700">
        <button
          type="button"
          onClick={prevStep}
          className={UI_STYLES.backButton}
        >
          ← Back
        </button>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saveLoading}
            className={`${UI_STYLES.secondaryButtonNeutral} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveLoading}
            className={UI_STYLES.primaryButton}
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
})

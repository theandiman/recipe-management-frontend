import React, { useState } from 'react'
import NutritionFacts from '../../../components/NutritionFacts'
import { scaleIngredient } from '../../../utils/quantityUtils'
import type { Recipe } from '../../../types/nutrition'
import { InstructionStepWithTimers } from './InstructionStepWithTimers'
import { FloatingKitchenTimer, type KitchenTimerState } from './FloatingKitchenTimer'

interface RecipeBodyProps {
  recipe: Recipe
}

const RecipeBody: React.FC<RecipeBodyProps> = ({ recipe }) => {
  const baseServings = typeof recipe.servings === 'number' && recipe.servings > 0 ? recipe.servings : 4
  const [currentServings, setCurrentServings] = useState<number>(baseServings)
  const [activeTimer, setActiveTimer] = useState<KitchenTimerState | null>(null)

  const multiplier = currentServings / baseServings
  const scaledIngredients = (recipe.ingredients || []).map(ing => scaleIngredient(ing, multiplier) as string)

  const handleStartTimer = (label: string, totalSeconds: number) => {
    setActiveTimer({
      id: `timer-${Date.now()}`,
      label,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: true,
    })
  }

  return (
    <>
      {recipe.description && (
        <p className="text-lg text-gray-600 mb-6">{recipe.description}</p>
      )}

      {/* Timing meta row */}
      <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-6">
          {(recipe.prepTimeMinutes || recipe.prepTime) && (
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm text-gray-500">Prep Time</div>
                <div className="font-medium">{recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : recipe.prepTime}</div>
              </div>
            </div>
          )}

          {(recipe.cookTimeMinutes || recipe.cookTime) && (
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <div>
                <div className="text-sm text-gray-500">Cook Time</div>
                <div className="font-medium">{recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min` : recipe.cookTime}</div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Serving Stepper */}
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-4 py-2 rounded-2xl">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Servings</span>
            <button
              onClick={() => setCurrentServings(s => Math.max(1, s - 1))}
              disabled={currentServings <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
              aria-label="Decrease servings"
            >
              -
            </button>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm min-w-[20px] text-center">
              {currentServings}
            </span>
            <button
              onClick={() => setCurrentServings(s => s + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold border border-gray-200 dark:border-slate-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
              aria-label="Increase servings"
            >
              +
            </button>
          </div>
          {multiplier !== 1 && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
              {multiplier < 1 ? `${multiplier.toFixed(1)}x` : `${multiplier}x`}
            </span>
          )}
        </div>
      </div>

      {/* Ingredients */}
      {scaledIngredients.length > 0 && (
        <div id="ingredients-section" className="mt-8 scroll-mt-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ingredients</h2>
            {multiplier !== 1 && (
              <button
                onClick={() => setCurrentServings(baseServings)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Reset to base ({baseServings})
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {scaledIngredients.map((ingredient: string, index: number) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 mr-3 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <div id="instructions-section" className="mt-8 scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm mr-4 flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="pt-1 flex-1">
                  <InstructionStepWithTimers
                    stepText={instruction}
                    stepIndex={index}
                    onStartTimer={handleStartTimer}
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dietary Restrictions */}
      {(recipe as Recipe & { dietaryRestrictions?: string[] }).dietaryRestrictions &&
        (recipe as Recipe & { dietaryRestrictions?: string[] }).dietaryRestrictions!.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Dietary</h3>
          <div className="flex flex-wrap gap-2">
            {(recipe as Recipe & { dietaryRestrictions?: string[] }).dietaryRestrictions!.map((r: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Facts */}
      {recipe.nutritionalInfo?.perServing && (
        <div id="nutrition-section" className="mt-8 pt-6 border-t border-gray-200 scroll-mt-24">
          <NutritionFacts nutritionalInfo={recipe.nutritionalInfo} />
        </div>
      )}

      {/* Tips & Tricks */}
      {recipe.tips && (
        <div id="tips-section" className="mt-10 pt-8 border-t border-gray-200 dark:border-slate-800 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-1.343a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Tips &amp; Tricks</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Substitutions, variations, and storage suggestions for best results</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Ingredient Substitutions */}
            {recipe.tips.substitutions && recipe.tips.substitutions.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50/70 via-amber-50/30 to-orange-50/40 dark:from-amber-950/30 dark:via-amber-900/15 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-200/60 dark:border-amber-800/30">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-sm">
                    🔄
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-amber-200 text-base">
                    Ingredient Substitutions
                  </h3>
                  <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                    {recipe.tips.substitutions.length} {recipe.tips.substitutions.length === 1 ? 'option' : 'options'}
                  </span>
                </div>
                <ul className="grid grid-cols-1 gap-2.5">
                  {recipe.tips.substitutions.map((sub: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-2xs text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        ⇄
                      </span>
                      <span className="flex-1">{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recipe Variations */}
            {recipe.tips.variations && recipe.tips.variations.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-violet-50/40 dark:from-indigo-950/30 dark:via-purple-900/15 dark:to-violet-950/20 border border-indigo-200/80 dark:border-indigo-800/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-indigo-200/60 dark:border-indigo-800/30">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    ✨
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-indigo-200 text-base">
                    Recipe Variations
                  </h3>
                  <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300">
                    {recipe.tips.variations.length} {recipe.tips.variations.length === 1 ? 'idea' : 'ideas'}
                  </span>
                </div>
                <ul className="grid grid-cols-1 gap-2.5">
                  {recipe.tips.variations.map((variation: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-2xs text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        ✦
                      </span>
                      <span className="flex-1">{variation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Storage, Make-Ahead & Reheating Grid */}
            {(recipe.tips.storage || recipe.tips.makeAhead || recipe.tips.reheating) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {recipe.tips.storage && (
                  <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-sm">📦</span>
                        <h3 className="font-bold text-sky-950 dark:text-sky-200 text-sm">Storage Instructions</h3>
                      </div>
                      <p className="text-xs text-sky-900/90 dark:text-sky-300/90 leading-relaxed">{recipe.tips.storage}</p>
                    </div>
                  </div>
                )}
                {recipe.tips.makeAhead && (
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm">⏰</span>
                        <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">Make-Ahead Tips</h3>
                      </div>
                      <p className="text-xs text-emerald-900/90 dark:text-emerald-300/90 leading-relaxed">{recipe.tips.makeAhead}</p>
                    </div>
                  </div>
                )}
                {recipe.tips.reheating && (
                  <div className="bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/40 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-sm">🔥</span>
                        <h3 className="font-bold text-orange-950 dark:text-orange-200 text-sm">Reheating Instructions</h3>
                      </div>
                      <p className="text-xs text-orange-900/90 dark:text-orange-300/90 leading-relaxed">{recipe.tips.reheating}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Kitchen Countdown Timer Widget */}
      <FloatingKitchenTimer
        timer={activeTimer}
        onClose={() => setActiveTimer(null)}
        onUpdateTimer={setActiveTimer}
      />
    </>
  )
}

export default RecipeBody

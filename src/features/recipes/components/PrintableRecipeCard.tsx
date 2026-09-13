import React from 'react'
import type { Recipe } from '../../../types/nutrition'
import { scaleIngredient } from '../../../utils/quantityUtils'
import { getEffectiveTips } from './RecipeBody'

export interface PrintableRecipeCardProps {
  recipe: Recipe
  servings?: number
  includePhoto?: boolean
  includeNutrition?: boolean
  includeTips?: boolean
  includeNotesArea?: boolean
  authorName?: string
  rating?: number
  ratingCount?: number
  isPrintPreview?: boolean
}

export const PrintableRecipeCard: React.FC<PrintableRecipeCardProps> = ({
  recipe,
  servings: customServings,
  includePhoto = true,
  includeNutrition = true,
  includeTips = true,
  includeNotesArea = true,
  authorName,
  rating,
  ratingCount,
  isPrintPreview = false,
}) => {
  const baseServings = typeof recipe.servings === 'number' && recipe.servings > 0 ? recipe.servings : 4
  const activeServings = customServings !== undefined && customServings > 0 ? customServings : baseServings
  const multiplier = activeServings / baseServings
  const scaledIngredients = (recipe.ingredients || []).map((ing) => scaleIngredient(ing, multiplier) as string)
  const effectiveTips = getEffectiveTips(recipe)

  const prepDisplay = recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : recipe.prepTime || null
  const cookDisplay = recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min` : recipe.cookTime || null
  const totalMinutes = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)
  const totalDisplay = totalMinutes > 0 ? `${totalMinutes} min` : null

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className={`bg-white text-slate-900 font-sans leading-relaxed ${
        isPrintPreview
          ? 'p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto'
          : 'p-4 sm:p-6 w-full max-w-4xl mx-auto'
      }`}
    >
      {/* Top Brand Banner */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-slate-900 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider uppercase text-slate-900">CookFlow • Recipe Collection</span>
          <span>•</span>
          <span>Kitchen Edition</span>
        </div>
        <div className="text-slate-400 text-[11px]">
          Printed {todayFormatted}
        </div>
      </div>

      {/* Recipe Title & Meta Header */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 mb-1.5 font-serif">
          {recipe.recipeName}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          {authorName && (
            <span className="font-semibold text-slate-800">
              By {authorName}
            </span>
          )}
          {typeof rating === 'number' && rating > 0 && (
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <span>⭐ {rating.toFixed(1)}</span>
              {typeof ratingCount === 'number' && ratingCount > 0 && (
                <span className="text-slate-500 font-normal">({ratingCount} reviews)</span>
              )}
            </span>
          )}
          {recipe.tags && recipe.tags.length > 0 && (
            <span className="text-slate-500">
              Tags: {recipe.tags.slice(0, 4).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Quick Specs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-5 print-avoid-break">
        <div>
          <span className="text-slate-500 font-medium block">Servings:</span>
          <span className="font-bold text-slate-900">
            {activeServings} {activeServings === 1 ? 'serving' : 'servings'}
            {multiplier !== 1 && (
              <span className="text-emerald-700 font-medium ml-1">
                ({multiplier.toFixed(1)}x scaled)
              </span>
            )}
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-medium block">Prep Time:</span>
          <span className="font-bold text-slate-900">{prepDisplay || '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium block">Cook Time:</span>
          <span className="font-bold text-slate-900">{cookDisplay || '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 font-medium block">Total Time:</span>
          <span className="font-bold text-slate-900">{totalDisplay || '—'}</span>
        </div>
      </div>

      {/* Photo & Description Row */}
      {(recipe.description || (includePhoto && recipe.imageUrl)) && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 print-avoid-break">
          {includePhoto && recipe.imageUrl && (
            <div className="sm:w-48 sm:h-36 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={recipe.imageUrl}
                alt={recipe.recipeName}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          )}
          {recipe.description && (
            <div className="flex-1 flex items-center">
              <p className="text-sm italic text-slate-700 leading-relaxed border-l-2 border-emerald-600 pl-3">
                &ldquo;{recipe.description}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Kitchen Grid: Ingredients & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        {/* Left Column: Ingredients Checklist (~42% on desktop/print) */}
        <div className="md:col-span-5 border-r-0 md:border-r md:border-slate-200 md:pr-6">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              Ingredients
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {activeServings} servings
            </span>
          </div>

          <ul className="space-y-2 text-xs">
            {scaledIngredients.map((ingredient, idx) => (
              <li key={idx} className="flex items-start gap-2.5 print-avoid-break leading-snug">
                {/* Checkbox box for kitchen prep */}
                <span
                  aria-hidden="true"
                  className="inline-block w-3.5 h-3.5 border border-slate-400 rounded-xs mt-0.5 shrink-0 bg-white"
                />
                <span className="text-slate-800 font-medium">{ingredient}</span>
              </li>
            ))}
          </ul>

          {/* Dietary badges */}
          {(recipe as Recipe & { dietaryRestrictions?: string[] }).dietaryRestrictions &&
            (recipe as Recipe & { dietaryRestrictions?: string[] }).dietaryRestrictions!.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200 print-avoid-break">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Dietary Information:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(recipe as Recipe & { dietaryRestrictions?: string[] }).dietaryRestrictions!.map(
                    (d, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-medium text-slate-700 capitalize"
                      >
                        {d}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Right Column: Instructions (~58% on desktop/print) */}
        <div className="md:col-span-7">
          <div className="border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              Instructions
            </h2>
          </div>

          <ol className="space-y-3.5 text-xs">
            {(recipe.instructions || []).map((instruction, idx) => (
              <li key={idx} className="flex items-start gap-3 print-avoid-break leading-relaxed">
                <span className="font-bold text-slate-900 bg-slate-100 border border-slate-300 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                  {idx + 1}
                </span>
                <span className="text-slate-800 pt-0.5">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Chef's Tips & Tricks Section */}
      {includeTips && effectiveTips && (
        <div className="mb-6 pt-4 border-t-2 border-slate-200 print-avoid-break">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5 flex items-center gap-1.5">
            <span>💡</span> Chef&apos;s Tips &amp; Storage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {effectiveTips.substitutions && effectiveTips.substitutions.length > 0 && (
              <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg">
                <span className="font-bold text-amber-900 block mb-1">Substitutions:</span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 text-[11px]">
                  {effectiveTips.substitutions.map((sub, i) => (
                    <li key={i}>{sub}</li>
                  ))}
                </ul>
              </div>
            )}
            {effectiveTips.storage && (
              <div className="p-2.5 bg-sky-50/50 border border-sky-200 rounded-lg">
                <span className="font-bold text-sky-900 block mb-1">Storage:</span>
                <p className="text-sky-900/90 text-[11px] leading-snug">{effectiveTips.storage}</p>
              </div>
            )}
            {effectiveTips.makeAhead && (
              <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                <span className="font-bold text-emerald-900 block mb-1">Make Ahead:</span>
                <p className="text-emerald-900/90 text-[11px] leading-snug">{effectiveTips.makeAhead}</p>
              </div>
            )}
            {effectiveTips.reheating && (
              <div className="p-2.5 bg-orange-50/50 border border-orange-200 rounded-lg">
                <span className="font-bold text-orange-900 block mb-1">Reheating:</span>
                <p className="text-orange-900/90 text-[11px] leading-snug">{effectiveTips.reheating}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nutrition Information Bar */}
      {includeNutrition && recipe.nutritionalInfo?.perServing && (
        <div className="mb-6 pt-3 border-t border-slate-200 print-avoid-break">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-bold text-slate-700">Nutrition per serving:</span>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-800">
              {recipe.nutritionalInfo.perServing.calories !== undefined && (
                <span>
                  <strong className="font-semibold text-slate-900">{recipe.nutritionalInfo.perServing.calories}</strong> kcal
                </span>
              )}
              {recipe.nutritionalInfo.perServing.protein !== undefined && (
                <span>
                  Protein: <strong className="font-semibold text-slate-900">{recipe.nutritionalInfo.perServing.protein}g</strong>
                </span>
              )}
              {recipe.nutritionalInfo.perServing.carbohydrates !== undefined && (
                <span>
                  Carbs: <strong className="font-semibold text-slate-900">{recipe.nutritionalInfo.perServing.carbohydrates}g</strong>
                </span>
              )}
              {recipe.nutritionalInfo.perServing.fat !== undefined && (
                <span>
                  Fat: <strong className="font-semibold text-slate-900">{recipe.nutritionalInfo.perServing.fat}g</strong>
                </span>
              )}
              {recipe.nutritionalInfo.perServing.fiber !== undefined && (
                <span>
                  Fiber: <strong className="font-semibold text-slate-900">{recipe.nutritionalInfo.perServing.fiber}g</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cook's Handwritten Notes Section */}
      {includeNotesArea && (
        <div className="mt-5 pt-3 border-t border-slate-200 print-avoid-break">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Cook&apos;s Notes &amp; Modifications:
          </span>
          <div className="space-y-3.5 pb-2">
            <div className="border-b border-dashed border-slate-300 h-3" />
            <div className="border-b border-dashed border-slate-300 h-3" />
            <div className="border-b border-dashed border-slate-300 h-3" />
          </div>
        </div>
      )}

      {/* Printable Footer */}
      <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
        <span>CookFlow Recipe Manager</span>
        <span>Happy Cooking!</span>
      </div>
    </div>
  )
}

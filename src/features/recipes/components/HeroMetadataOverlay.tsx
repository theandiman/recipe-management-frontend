import React from 'react'
import type { Recipe } from '../../../types/nutrition'

interface HeroMetadataOverlayProps {
  recipe: Recipe
}

export const HeroMetadataOverlay: React.FC<HeroMetadataOverlayProps> = ({ recipe }) => {
  const prepTime = recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes}m` : recipe.prepTime
  const cookTime = recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes}m` : recipe.cookTime
  const servings = recipe.servings || 4
  const calories = recipe.nutritionalInfo?.perServing?.calories

  return (
    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {prepTime && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-sm">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Prep: {prepTime}</span>
          </div>
        )}

        {cookTime && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-sm">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            <span>Cook: {cookTime}</span>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-sm">
          <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>{servings} Servings</span>
        </div>

        {calories && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-sm">
            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{calories} kcal</span>
          </div>
        )}
      </div>
    </div>
  )
}

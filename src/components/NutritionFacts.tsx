import React from 'react'
import type { NutritionalInfo, NutritionalValues } from '../types/nutrition'

interface NutritionFactsProps {
  nutritionalInfo: NutritionalInfo;
  servings?: string | number;
  targetServings?: number | null;
}

/**
 * NutritionFacts component displays nutritional information in UK-style format
 * with colored indicators for each nutrient (similar to traffic light system)
 */
export default function NutritionFacts({ nutritionalInfo, servings, targetServings }: NutritionFactsProps) {
  const perServing = nutritionalInfo?.perServing
  
  if (!perServing) {
    return null
  }

  // Helper to format numbers with proper decimal places
  const formatNumber = (value: number, decimals: number = 1): string => {
    return Number.isFinite(value) ? value.toFixed(decimals) : '0'
  }

  // Calculate daily value percentages (based on UK GDA - Guideline Daily Amounts)
  // UK adult GDA: 2000kcal, 70g fat (20g saturates), 90g sugar, 6g salt, 50g protein, 260g carbs
  const calculatePercentage = (value: number, reference: number): number => {
    if (!Number.isFinite(value) || !Number.isFinite(reference) || reference === 0) return 0
    return Math.round((value / reference) * 100)
  }

  const nutrients = [
    {
      name: 'Energy',
      value: `${Math.round(perServing.calories * 4.184)}kJ`,
      subValue: `${Math.round(perServing.calories)}kcal`,
      percentage: calculatePercentage(perServing.calories, 2000),
      color: 'bg-gray-50 border-gray-300 text-gray-800'
    },
    {
      name: 'Fat',
      value: `${formatNumber(perServing.fat)}g`,
      percentage: calculatePercentage(perServing.fat, 70),
      color: perServing.fat > 17.5 ? 'bg-red-500 text-white' : 
             perServing.fat > 3 ? 'bg-amber-500 text-white' : 
             'bg-green-500 text-white'
    },
    {
      name: 'Saturates',
      value: `${formatNumber(perServing.fat * 0.4)}g`, // Estimate saturated fat as ~40% of total
      percentage: calculatePercentage(perServing.fat * 0.4, 20),
      color: (perServing.fat * 0.4) > 5 ? 'bg-red-500 text-white' : 
             (perServing.fat * 0.4) > 1.5 ? 'bg-amber-500 text-white' : 
             'bg-green-500 text-white'
    },
    {
      name: 'Sugars',
      value: `${formatNumber(perServing.carbohydrates * 0.3)}g`, // Estimate sugars as ~30% of carbs
      percentage: calculatePercentage(perServing.carbohydrates * 0.3, 90),
      color: (perServing.carbohydrates * 0.3) > 22.5 ? 'bg-red-500 text-white' : 
             (perServing.carbohydrates * 0.3) > 5 ? 'bg-amber-500 text-white' : 
             'bg-green-500 text-white'
    },
    {
      name: 'Salt',
      value: `${formatNumber(perServing.sodium / 400)}g`, // Convert mg sodium to g salt (sodium * 2.5 / 1000)
      percentage: calculatePercentage(perServing.sodium / 400, 6),
      color: (perServing.sodium / 400) > 1.5 ? 'bg-red-500 text-white' : 
             (perServing.sodium / 400) > 0.3 ? 'bg-amber-500 text-white' : 
             'bg-green-500 text-white'
    }
  ]

  // Calculate serving size estimate (typical serving ~150g)
  const servingSize = 150

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full shadow-sm">
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="text-sm font-bold text-gray-700">Each serving ({servingSize}g) contains</h3>
      </div>

      {/* Nutrient pills - horizontal row */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        {nutrients.map((nutrient, index) => (
          <div 
            key={index}
            className={`
              ${nutrient.color}
              rounded-2xl px-3 py-2.5 flex flex-col items-center justify-center
              ${index === 0 ? 'border-2' : ''}
              min-w-[85px] flex-1 max-w-[110px]
            `}
          >
            <div className="text-xs font-bold mb-0.5 whitespace-nowrap">{nutrient.name}</div>
            <div className="font-extrabold leading-tight">
              {nutrient.subValue ? (
                <div className="flex flex-col items-center">
                  <div className="text-xs leading-none">{nutrient.value}</div>
                  <div className="text-lg leading-none mt-0.5">{nutrient.subValue}</div>
                </div>
              ) : (
                <div className="text-xl leading-none">{nutrient.value}</div>
              )}
            </div>
            <div className="text-base font-extrabold mt-0.5">{nutrient.percentage}%</div>
          </div>
        ))}
      </div>

      {/* Footer - per 100g reference */}
      <div className="text-center pt-2 border-t border-gray-300">
        <p className="text-xs text-gray-500">
          Typical values per 100g: Energy {Math.round(perServing.calories * 100 / servingSize * 4.184)}kJ/{Math.round(perServing.calories * 100 / servingSize)}kcal
        </p>
      </div>
    </div>
  )
}


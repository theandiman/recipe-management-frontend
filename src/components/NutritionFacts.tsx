import { motion } from 'framer-motion'
import type { NutritionalInfo } from '../types/nutrition'

// Nutrition calculation constants
const SATURATED_FAT_RATIO = 0.4 // Estimate saturated fat as ~40% of total fat
const SUGAR_RATIO = 0.3 // Estimate sugars as ~30% of carbohydrates
const SODIUM_TO_SALT_CONVERSION = 400 // Convert mg sodium to g salt (sodium * 2.5 / 1000)
const DEFAULT_SERVING_SIZE = 150 // Typical serving size in grams

interface NutritionFactsProps {
  nutritionalInfo: NutritionalInfo;
}

/**
 * NutritionFacts component displays nutritional information in UK-style format
 * with colored indicators for each nutrient (similar to traffic light system)
 */
export default function NutritionFacts({ nutritionalInfo }: NutritionFactsProps) {
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
      value: `${Math.round((perServing.calories ?? 0) * 4.184)}kJ`,
      subValue: `${Math.round(perServing.calories ?? 0)}kcal`,
      percentage: calculatePercentage(perServing.calories ?? 0, 2000),
      color: 'bg-gray-50 border-gray-300 text-gray-800'
    },
    {
      name: 'Fat',
      value: `${formatNumber(perServing.fat ?? 0)}g`,
      percentage: calculatePercentage(perServing.fat ?? 0, 70),
      color: (perServing.fat ?? 0) > 17.5 ? 'bg-red-500 text-white' : 
             (perServing.fat ?? 0) > 3 ? 'bg-amber-500 text-white' : 
             'bg-green-500 text-white'
    },
    {
      name: 'Saturates',
      value: `${formatNumber((perServing.fat ?? 0) * SATURATED_FAT_RATIO)}g`,
      percentage: calculatePercentage((perServing.fat ?? 0) * SATURATED_FAT_RATIO, 20),
      color: ((perServing.fat ?? 0) * SATURATED_FAT_RATIO) > 5 ? 'bg-red-500 text-white' : 
             ((perServing.fat ?? 0) * SATURATED_FAT_RATIO) > 1.5 ? 'bg-amber-500 text-white' : 
             'bg-green-500 text-white'
    },
    {
      name: 'Sugars',
      value: `${formatNumber((perServing.carbohydrates ?? 0) * SUGAR_RATIO)}g`,
      percentage: calculatePercentage((perServing.carbohydrates ?? 0) * SUGAR_RATIO, 90),
      color: ((perServing.carbohydrates ?? 0) * SUGAR_RATIO) > 22.5 ? 'bg-red-500 text-white' : 
             ((perServing.carbohydrates ?? 0) * SUGAR_RATIO) > 5 ? 'bg-amber-500 text-white' : 
             'bg-green-500 text-white'
    },
    {
      name: 'Salt',
      value: `${formatNumber((perServing.sodium ?? 0) / SODIUM_TO_SALT_CONVERSION)}g`,
      percentage: calculatePercentage((perServing.sodium ?? 0) / SODIUM_TO_SALT_CONVERSION, 6),
      color: ((perServing.sodium ?? 0) / SODIUM_TO_SALT_CONVERSION) > 1.5 ? 'bg-red-500 text-white' : 
             ((perServing.sodium ?? 0) / SODIUM_TO_SALT_CONVERSION) > 0.3 ? 'bg-amber-500 text-white' : 
             'bg-green-500 text-white'
    }
  ]

  // Calculate serving size estimate
  const servingSize = DEFAULT_SERVING_SIZE

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 w-full shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nutrition Facts</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-semibold">Per Serving ({servingSize}g)</p>
      </div>

      {/* Nutrient horizontal bars */}
      <div className="space-y-5 mb-6">
        {nutrients.map((nutrient, index) => {
          // Parse out the color class just to get a safe hex or tailwind class without text-white
          const barColor = nutrient.color.includes('bg-red') ? 'bg-red-500' : 
                         nutrient.color.includes('bg-amber') ? 'bg-amber-500' : 
                         nutrient.color.includes('bg-green') ? 'bg-emerald-500' : 'bg-blue-500'
                         
          return (
            <div key={index}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm tracking-wide">{nutrient.name}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{nutrient.subValue ? `${nutrient.value} (${nutrient.subValue})` : nutrient.value}</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1.5">({nutrient.percentage}%)</span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(nutrient.percentage, 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer - per 100g reference */}
      <div className="text-center pt-4 border-t border-gray-100 dark:border-slate-700/50">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Typical values per 100g: Energy {Math.round((perServing.calories ?? 0) * 100 / servingSize * 4.184)}kJ / {Math.round((perServing.calories ?? 0) * 100 / servingSize)}kcal
        </p>
      </div>
    </div>
  )
}


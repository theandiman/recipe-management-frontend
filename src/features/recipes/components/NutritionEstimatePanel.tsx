import React from 'react'
import type { NutritionEstimate, NutritionEstimateResponse, NutritionLoadingState } from '../hooks/useNutritionEstimate'

interface NutritionEstimatePanelProps {
  estimate: NutritionEstimateResponse | null
  loadingState: NutritionLoadingState
  error: string | null
  onAccept: () => void
  onDismiss: () => void
}

function formatNutrient(value: number, unit: string, estimated: boolean): string {
  return `${estimated ? '~' : ''}${value}${unit}`
}

function NutrientRow({
  label,
  perServing,
  wholeRecipe,
}: {
  label: string
  perServing: { value: number; unit: string; estimated: boolean } | undefined
  wholeRecipe: { value: number; unit: string; estimated: boolean } | undefined
}) {
  if (!perServing || !wholeRecipe) return null
  return (
    <tr>
      <td className="py-1 pr-4 font-medium text-gray-700 dark:text-gray-300">{label}</td>
      <td className="py-1 pr-4 text-right text-gray-900 dark:text-gray-100">
        {formatNutrient(perServing.value, perServing.unit, perServing.estimated)}
      </td>
      <td className="py-1 text-right text-gray-900 dark:text-gray-100">
        {formatNutrient(wholeRecipe.value, wholeRecipe.unit, wholeRecipe.estimated)}
      </td>
    </tr>
  )
}

function NutritionTable({
  perServing,
  wholeRecipe,
}: {
  perServing: NutritionEstimate
  wholeRecipe: NutritionEstimate
}) {
  return (
    <table className="w-full text-sm mt-2">
      <thead>
        <tr>
          <th className="text-left py-1 pr-4 text-gray-500 dark:text-gray-400 font-normal">Nutrient</th>
          <th className="text-right py-1 pr-4 text-gray-500 dark:text-gray-400 font-normal">Per Serving</th>
          <th className="text-right py-1 text-gray-500 dark:text-gray-400 font-normal">Whole Recipe</th>
        </tr>
      </thead>
      <tbody>
        <NutrientRow label="Calories" perServing={perServing.calories} wholeRecipe={wholeRecipe.calories} />
        <NutrientRow label="Protein" perServing={perServing.protein} wholeRecipe={wholeRecipe.protein} />
        <NutrientRow label="Carbs" perServing={perServing.carbs} wholeRecipe={wholeRecipe.carbs} />
        <NutrientRow label="Fat" perServing={perServing.fat} wholeRecipe={wholeRecipe.fat} />
        <NutrientRow label="Fiber" perServing={perServing.fiber} wholeRecipe={wholeRecipe.fiber} />
      </tbody>
    </table>
  )
}

export const NutritionEstimatePanel: React.FC<NutritionEstimatePanelProps> = ({
  estimate,
  loadingState,
  error,
  onAccept,
  onDismiss,
}) => {
  if (loadingState === 'loading') {
    return (
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-600 dark:text-blue-400">Estimating nutrition…</p>
      </div>
    )
  }

  if (loadingState === 'error') {
    return (
      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          {error ?? 'Could not estimate nutrition.'} Please try again.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 underline"
        >
          Dismiss
        </button>
      </div>
    )
  }

  if (!estimate || !estimate.perServing || !estimate.wholeRecipe) return null

  const warnings = estimate.perServing.warnings ?? []
  const isPartial = estimate.perServing.isPartial || estimate.wholeRecipe.isPartial

  return (
    <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
      <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
        Nutrition Estimate
        {isPartial && (
          <span className="ml-2 text-xs font-normal text-yellow-600 dark:text-yellow-400">(partial)</span>
        )}
      </h4>

      <NutritionTable perServing={estimate.perServing} wholeRecipe={estimate.wholeRecipe} />

      {(isPartial || warnings.length > 0) && (
        <ul className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 list-disc list-inside space-y-0.5">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
          {isPartial && warnings.length === 0 && (
            <li>Some ingredients could not be fully estimated</li>
          )}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

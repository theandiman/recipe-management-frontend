import React from 'react'
import type { NutritionEstimate, NutritionEstimateResponse, NutritionLoadingState } from '../hooks/useNutritionEstimate'
import {
  AI_EYEBROW_CLASS,
  AI_MUTED_PANEL_CLASS,
  AI_PANEL_CLASS,
  AI_PRIMARY_ACTION_CLASS,
  AI_SECONDARY_ACTION_CLASS,
} from './aiStyles'

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
      <div className={`mt-3 p-3 ${AI_MUTED_PANEL_CLASS}`}>
        <p className={AI_EYEBROW_CLASS}>AI estimate</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-gray-700 dark:text-gray-200">Estimating nutrition...</p>
        </div>
      </div>
    )
  }

  if (loadingState === 'error') {
    return (
      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/60 dark:bg-rose-950/40">
        <p className="text-sm text-rose-700 dark:text-rose-200">
          {error ?? 'Could not estimate nutrition.'} Please try again.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 text-xs font-medium text-rose-700 underline underline-offset-2 dark:text-rose-200"
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
    <div className={`mt-3 p-4 ${AI_PANEL_CLASS}`}>
      <div className="mb-2">
        <p className={AI_EYEBROW_CLASS}>AI estimate</p>
        <div className="mt-1 flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Nutrition estimate
            <span className="sr-only">, AI generated</span>
          </h4>
        {isPartial && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
              Partial
            </span>
        )}
        </div>
      </div>

      <NutritionTable perServing={estimate.perServing} wholeRecipe={estimate.wholeRecipe} />

      {(isPartial || warnings.length > 0) && (
        <ul className="mt-3 list-disc list-inside space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
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
          className={AI_PRIMARY_ACTION_CLASS}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className={AI_SECONDARY_ACTION_CLASS}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

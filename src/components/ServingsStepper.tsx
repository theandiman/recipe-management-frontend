import React from 'react'

type Props = {
  servings: unknown
  targetServings: number | null
  setTargetServings?: (n: number) => void
}

export default function ServingsStepper({ servings, targetServings, setTargetServings }: Props) {
  // compute numeric base when possible
  let baseNum: number | null = null
  if (typeof servings === 'number') baseNum = servings
  else if (typeof servings === 'string' && /^\s*\d+(?:\.\d+)?\s*$/.test(servings)) baseNum = parseFloat(servings)

  const current = targetServings ?? baseNum ?? '—'

  if (baseNum == null) {
    return (
      <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M12 3v18"/></svg>
        <span className="text-sm mr-2">Servings</span>
        <span className="text-sm">{String(servings ?? '—')}</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M12 3v18"/></svg>
      <span className="text-sm mr-2">Servings</span>
      <span className="inline-flex items-center bg-white border rounded-md overflow-hidden text-sm">
        <button type="button" aria-label="Decrease servings" className="px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setTargetServings && setTargetServings(Math.max(1, (targetServings || baseNum) - 1))}>-</button>
        <span className="px-3 py-0.5 text-sm">{current}</span>
        <button type="button" aria-label="Increase servings" className="px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100" onClick={() => setTargetServings && setTargetServings((targetServings || baseNum) + 1)}>+</button>
      </span>
    </div>
  )
}

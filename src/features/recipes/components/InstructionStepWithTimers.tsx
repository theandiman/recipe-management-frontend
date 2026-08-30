import React from 'react'
import { parseTimerDurations } from '../utils/timerParser'

interface InstructionStepWithTimersProps {
  stepText: string
  stepIndex: number
  onStartTimer: (label: string, totalSeconds: number) => void
}

export const InstructionStepWithTimers: React.FC<InstructionStepWithTimersProps> = ({
  stepText,
  stepIndex,
  onStartTimer,
}) => {
  const detectedTimers = parseTimerDurations(stepText)

  if (detectedTimers.length === 0) {
    return <span className="text-gray-800 dark:text-gray-200">{stepText}</span>
  }

  // Segment text around detected timer matches
  const segments: React.ReactNode[] = []
  let lastIndex = 0

  detectedTimers.forEach((timer, idx) => {
    // Add text before match
    if (timer.startIndex > lastIndex) {
      segments.push(
        <span key={`text-${idx}`}>
          {stepText.slice(lastIndex, timer.startIndex)}
        </span>
      )
    }

    // Add interactive timer chip
    segments.push(
      <button
        key={`timer-${idx}`}
        type="button"
        onClick={() => onStartTimer(`Step ${stepIndex + 1}: ${timer.label}`, timer.totalSeconds)}
        title={`Start ${timer.label} kitchen timer`}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 my-0.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold text-xs rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <span className="text-xs">⏱️</span>
        <span>{timer.label}</span>
      </button>
    )

    lastIndex = timer.endIndex
  })

  // Add remaining trailing text
  if (lastIndex < stepText.length) {
    segments.push(<span key="text-end">{stepText.slice(lastIndex)}</span>)
  }

  return <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{segments}</span>
}

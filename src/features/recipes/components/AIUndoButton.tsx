import React, { useEffect, useState } from 'react'
import { AIBadge } from './AIBadge'
import { AI_BUTTON_COMPACT_CLASS } from './aiStyles'

interface AIUndoButtonProps {
  lastField: string | null
  onUndo: () => void
  fieldLabels: Record<string, string>
}

/**
 * Subtle undo affordance shown after an AI suggestion is applied.
 * Auto-dismisses after 8 seconds; timer resets whenever lastField changes.
 */
export const AIUndoButton: React.FC<AIUndoButtonProps> = ({ lastField, onUndo, fieldLabels }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!lastField) return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [lastField])

  if (!lastField || !visible) return null

  const label = fieldLabels[lastField] ?? lastField

  return (
    <button
      type="button"
      onClick={onUndo}
      aria-label={`Undo: ${label}`}
      className={AI_BUTTON_COMPACT_CLASS}
    >
      <AIBadge />
      <span aria-hidden="true" className="text-gray-400 dark:text-gray-500">/</span>
      <span className="text-gray-600 dark:text-gray-200">Undo {label}</span>
    </button>
  )
}

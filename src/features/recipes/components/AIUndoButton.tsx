import React, { useEffect, useState } from 'react'

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
      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
    >
      ↩ Undo: {label}
    </button>
  )
}

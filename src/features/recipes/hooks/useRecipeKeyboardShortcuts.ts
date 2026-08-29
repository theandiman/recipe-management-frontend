import { useEffect } from 'react'

interface RecipeKeyboardShortcutsOptions {
  onCookMode?: () => void
  onLike?: () => void
  onBookmark?: () => void
  onJumpIngredients?: () => void
  onToggleShortcutsModal?: () => void
  disabled?: boolean
}

export function useRecipeKeyboardShortcuts({
  onCookMode,
  onLike,
  onBookmark,
  onJumpIngredients,
  onToggleShortcutsModal,
  disabled = false,
}: RecipeKeyboardShortcutsOptions) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null
      const tagName = target?.tagName?.toUpperCase()
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target?.isContentEditable
      ) {
        return
      }

      // Check key pressed
      const key = e.key.toLowerCase()

      if (key === 'c' && onCookMode) {
        e.preventDefault()
        onCookMode()
      } else if (key === 'l' && onLike) {
        e.preventDefault()
        onLike()
      } else if (key === 'b' && onBookmark) {
        e.preventDefault()
        onBookmark()
      } else if (key === 'i' && onJumpIngredients) {
        e.preventDefault()
        onJumpIngredients()
      } else if ((key === '?' || e.key === '/') && onToggleShortcutsModal) {
        e.preventDefault()
        onToggleShortcutsModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCookMode, onLike, onBookmark, onJumpIngredients, onToggleShortcutsModal, disabled])
}

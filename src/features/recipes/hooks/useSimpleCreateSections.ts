/**
 * useSimpleCreateSections
 *
 * Manages the open/closed state of optional collapsible sections
 * in the SimpleCreateRecipe form. Open state is persisted to
 * sessionStorage so it survives in-session navigation.
 */
import { useCallback, useEffect, useState } from 'react'

const SESSION_KEY = 'simple-create-sections'

interface SectionState {
  timing: boolean
  serving: boolean
  tags: boolean
  photo: boolean
}

function loadFromSession(): SectionState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw) as SectionState
  } catch {
    // ignore parse errors
  }
  return { timing: false, serving: false, tags: false, photo: false }
}

function saveToSession(state: SectionState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors (e.g., private browsing quota)
  }
}

export function useSimpleCreateSections() {
  const [open, setOpen] = useState<SectionState>(loadFromSession)

  // Persist whenever open state changes
  useEffect(() => {
    saveToSession(open)
  }, [open])

  const toggle = useCallback((key: keyof SectionState) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  return {
    timing: {
      isOpen: open.timing,
      toggle: () => toggle('timing'),
      isFilled: (prepTime: string, cookTime: string) => !!prepTime || !!cookTime,
    },
    serving: {
      isOpen: open.serving,
      toggle: () => toggle('serving'),
      isFilled: (servings: string) => !!servings,
    },
    tags: {
      isOpen: open.tags,
      toggle: () => toggle('tags'),
      isFilled: (tags: string[], dietaryRestrictions: string[]) =>
        tags.length > 0 || dietaryRestrictions.length > 0,
    },
    photo: {
      isOpen: open.photo,
      toggle: () => toggle('photo'),
      isFilled: (imagePreview: string | null) => !!imagePreview,
    },
  }
}

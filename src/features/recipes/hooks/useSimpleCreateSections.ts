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
  nutrition: boolean
  tags: boolean
  tips: boolean
  photo: boolean
}

const DEFAULT_SECTION_STATE: SectionState = {
  timing: false,
  serving: false,
  nutrition: false,
  tags: false,
  tips: false,
  photo: false,
}

const SECTION_KEYS = Object.keys(DEFAULT_SECTION_STATE) as Array<keyof SectionState>

function loadFromSession(): SectionState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed !== null && typeof parsed === 'object') {
        const record = parsed as Record<string, unknown>
        return SECTION_KEYS.reduce<SectionState>(
          (acc, key) => ({
            ...acc,
            [key]: typeof record[key] === 'boolean' ? record[key] : DEFAULT_SECTION_STATE[key],
          }),
          { ...DEFAULT_SECTION_STATE },
        )
      }
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SECTION_STATE }
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
    nutrition: {
      isOpen: open.nutrition,
      toggle: () => toggle('nutrition'),
      isFilled: (hasNutrition: boolean) => hasNutrition,
    },
    tags: {
      isOpen: open.tags,
      toggle: () => toggle('tags'),
      isFilled: (tags: string[], dietaryRestrictions: string[]) =>
        tags.length > 0 || dietaryRestrictions.length > 0,
    },
    tips: {
      isOpen: open.tips,
      toggle: () => toggle('tips'),
      isFilled: (
        storage?: string,
        makeAhead?: string,
        reheating?: string,
        subs?: string[],
        vars?: string[]
      ) =>
        !!storage ||
        !!makeAhead ||
        !!reheating ||
        (Boolean(subs) && subs!.length > 0) ||
        (Boolean(vars) && vars!.length > 0),
    },
    photo: {
      isOpen: open.photo,
      toggle: () => toggle('photo'),
      isFilled: (imagePreview: string | null) => !!imagePreview,
    },
  }
}

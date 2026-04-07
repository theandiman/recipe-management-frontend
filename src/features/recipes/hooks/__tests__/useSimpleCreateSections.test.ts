import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSimpleCreateSections } from '../useSimpleCreateSections'

describe('useSimpleCreateSections', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('all sections are closed by default', () => {
    const { result } = renderHook(() => useSimpleCreateSections())
    expect(result.current.timing.isOpen).toBe(false)
    expect(result.current.serving.isOpen).toBe(false)
    expect(result.current.tags.isOpen).toBe(false)
    expect(result.current.photo.isOpen).toBe(false)
  })

  it('toggles timing section open and closed', () => {
    const { result } = renderHook(() => useSimpleCreateSections())
    expect(result.current.timing.isOpen).toBe(false)

    act(() => {
      result.current.timing.toggle()
    })
    expect(result.current.timing.isOpen).toBe(true)

    act(() => {
      result.current.timing.toggle()
    })
    expect(result.current.timing.isOpen).toBe(false)
  })

  it('toggles sections independently', () => {
    const { result } = renderHook(() => useSimpleCreateSections())

    act(() => {
      result.current.timing.toggle()
    })
    act(() => {
      result.current.photo.toggle()
    })

    expect(result.current.timing.isOpen).toBe(true)
    expect(result.current.serving.isOpen).toBe(false)
    expect(result.current.tags.isOpen).toBe(false)
    expect(result.current.photo.isOpen).toBe(true)
  })

  it('persists open state to sessionStorage', () => {
    const { result } = renderHook(() => useSimpleCreateSections())

    act(() => {
      result.current.timing.toggle()
    })

    const stored = JSON.parse(sessionStorage.getItem('simple-create-sections') ?? '{}')
    expect(stored.timing).toBe(true)
    expect(stored.serving).toBe(false)
  })

  it('loads open state from sessionStorage on mount', () => {
    sessionStorage.setItem(
      'simple-create-sections',
      JSON.stringify({ timing: true, serving: false, tags: true, photo: false })
    )

    const { result } = renderHook(() => useSimpleCreateSections())
    expect(result.current.timing.isOpen).toBe(true)
    expect(result.current.tags.isOpen).toBe(true)
    expect(result.current.serving.isOpen).toBe(false)
    expect(result.current.photo.isOpen).toBe(false)
  })

  describe('isFilled helpers', () => {
    it('timing.isFilled is true when prepTime is set', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.timing.isFilled('15', '')).toBe(true)
    })

    it('timing.isFilled is true when cookTime is set', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.timing.isFilled('', '30')).toBe(true)
    })

    it('timing.isFilled is false when both are empty', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.timing.isFilled('', '')).toBe(false)
    })

    it('serving.isFilled is true when servings is set', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.serving.isFilled('4')).toBe(true)
    })

    it('serving.isFilled is false when servings is empty', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.serving.isFilled('')).toBe(false)
    })

    it('tags.isFilled is true when tags array is non-empty', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.tags.isFilled(['vegetarian'], [])).toBe(true)
    })

    it('tags.isFilled is true when dietaryRestrictions is non-empty', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.tags.isFilled([], ['vegan'])).toBe(true)
    })

    it('tags.isFilled is false when both are empty', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.tags.isFilled([], [])).toBe(false)
    })

    it('photo.isFilled is true when imagePreview is set', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.photo.isFilled('data:image/png;base64,...')).toBe(true)
    })

    it('photo.isFilled is false when imagePreview is null', () => {
      const { result } = renderHook(() => useSimpleCreateSections())
      expect(result.current.photo.isFilled(null)).toBe(false)
    })
  })
})

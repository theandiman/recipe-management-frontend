import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useRecipeKeyboardShortcuts } from '../useRecipeKeyboardShortcuts'

describe('useRecipeKeyboardShortcuts', () => {
  it('triggers onCookMode when C is pressed', () => {
    const onCookMode = vi.fn()
    renderHook(() => useRecipeKeyboardShortcuts({ onCookMode }))

    const event = new KeyboardEvent('keydown', { key: 'c' })
    window.dispatchEvent(event)

    expect(onCookMode).toHaveBeenCalledTimes(1)
  })

  it('triggers onLike when L is pressed', () => {
    const onLike = vi.fn()
    renderHook(() => useRecipeKeyboardShortcuts({ onLike }))

    const event = new KeyboardEvent('keydown', { key: 'l' })
    window.dispatchEvent(event)

    expect(onLike).toHaveBeenCalledTimes(1)
  })

  it('triggers onBookmark when B is pressed', () => {
    const onBookmark = vi.fn()
    renderHook(() => useRecipeKeyboardShortcuts({ onBookmark }))

    const event = new KeyboardEvent('keydown', { key: 'b' })
    window.dispatchEvent(event)

    expect(onBookmark).toHaveBeenCalledTimes(1)
  })

  it('triggers onJumpIngredients when I is pressed', () => {
    const onJumpIngredients = vi.fn()
    renderHook(() => useRecipeKeyboardShortcuts({ onJumpIngredients }))

    const event = new KeyboardEvent('keydown', { key: 'i' })
    window.dispatchEvent(event)

    expect(onJumpIngredients).toHaveBeenCalledTimes(1)
  })

  it('triggers onToggleShortcutsModal when ? is pressed', () => {
    const onToggleShortcutsModal = vi.fn()
    renderHook(() => useRecipeKeyboardShortcuts({ onToggleShortcutsModal }))

    const event = new KeyboardEvent('keydown', { key: '?' })
    window.dispatchEvent(event)

    expect(onToggleShortcutsModal).toHaveBeenCalledTimes(1)
  })

  it('ignores hotkeys when disabled is true', () => {
    const onCookMode = vi.fn()
    renderHook(() => useRecipeKeyboardShortcuts({ onCookMode, disabled: true }))

    const event = new KeyboardEvent('keydown', { key: 'c' })
    window.dispatchEvent(event)

    expect(onCookMode).not.toHaveBeenCalled()
  })

  it('ignores hotkeys when typing in an input element', () => {
    const onCookMode = vi.fn()
    renderHook(() => useRecipeKeyboardShortcuts({ onCookMode }))

    const input = document.createElement('input')
    document.body.appendChild(input)

    const event = new KeyboardEvent('keydown', { key: 'c' })
    Object.defineProperty(event, 'target', { value: input, enumerable: true })
    window.dispatchEvent(event)

    expect(onCookMode).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })
})

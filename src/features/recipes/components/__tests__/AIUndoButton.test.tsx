import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AIUndoButton } from '../AIUndoButton'
import { FIELD_LABELS } from '../../constants/aiConstants'

describe('AIUndoButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when lastField is null', () => {
    const { container } = render(
      <AIUndoButton lastField={null} onUndo={vi.fn()} fieldLabels={FIELD_LABELS} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders undo button with mapped label when lastField is set', () => {
    render(
      <AIUndoButton lastField="recipeName" onUndo={vi.fn()} fieldLabels={FIELD_LABELS} />
    )
    expect(screen.getByRole('button', { name: /Undo: Recipe Name/i })).toBeInTheDocument()
  })

  it('renders undo button using raw field key as fallback when label not found', () => {
    render(
      <AIUndoButton lastField="unknownField" onUndo={vi.fn()} fieldLabels={FIELD_LABELS} />
    )
    expect(screen.getByRole('button', { name: /Undo: unknownField/i })).toBeInTheDocument()
  })

  it('calls onUndo when the button is clicked', () => {
    const onUndo = vi.fn()
    render(
      <AIUndoButton lastField="description" onUndo={onUndo} fieldLabels={FIELD_LABELS} />
    )
    fireEvent.click(screen.getByRole('button', { name: /Undo: Description/i }))
    expect(onUndo).toHaveBeenCalledOnce()
  })

  it('auto-dismisses after 8 seconds', () => {
    render(
      <AIUndoButton lastField="recipeName" onUndo={vi.fn()} fieldLabels={FIELD_LABELS} />
    )
    expect(screen.getByRole('button', { name: /Undo: Recipe Name/i })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(screen.queryByRole('button', { name: /Undo: Recipe Name/i })).not.toBeInTheDocument()
  })

  it('resets the auto-dismiss timer when lastField changes', () => {
    const { rerender } = render(
      <AIUndoButton lastField="recipeName" onUndo={vi.fn()} fieldLabels={FIELD_LABELS} />
    )

    // Advance 5 seconds — not dismissed yet
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('button', { name: /Undo: Recipe Name/i })).toBeInTheDocument()

    // Change lastField — timer should reset
    rerender(
      <AIUndoButton lastField="description" onUndo={vi.fn()} fieldLabels={FIELD_LABELS} />
    )

    // Another 5 seconds: total 10s from start but only 5s from last change — still visible
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('button', { name: /Undo: Description/i })).toBeInTheDocument()

    // Another 3 seconds — now 8s from last change — dismissed
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.queryByRole('button', { name: /Undo: Description/i })).not.toBeInTheDocument()
  })
})

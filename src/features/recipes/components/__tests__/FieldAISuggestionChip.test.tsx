import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FieldAISuggestionChip } from '../FieldAISuggestionChip'

describe('FieldAISuggestionChip', () => {
  it('renders the suggestion text', () => {
    render(
      <FieldAISuggestionChip
        field="recipeName"
        suggestion="A delicious pasta dish"
        currentValue=""
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(screen.getByText('A delicious pasta dish')).toBeInTheDocument()
  })

  it('shows an understated AI suggestion label above the suggestion content', () => {
    render(
      <FieldAISuggestionChip
        field="recipeName"
        suggestion="A delicious pasta dish"
        currentValue=""
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText('AI suggestion')).toBeInTheDocument()
  })

  it('shows Apply and Dismiss buttons', () => {
    render(
      <FieldAISuggestionChip
        field="recipeName"
        suggestion="A delicious pasta dish"
        currentValue=""
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
  })

  it('calls onApply when Apply clicked', () => {
    const onApply = vi.fn()
    render(
      <FieldAISuggestionChip
        field="recipeName"
        suggestion="A delicious pasta dish"
        currentValue=""
        onApply={onApply}
        onDismiss={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(onApply).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when Dismiss clicked', () => {
    const onDismiss = vi.fn()
    render(
      <FieldAISuggestionChip
        field="recipeName"
        suggestion="A delicious pasta dish"
        currentValue=""
        onApply={vi.fn()}
        onDismiss={onDismiss}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('shows before/after comparison with strikethrough when currentValue is non-empty', () => {
    render(
      <FieldAISuggestionChip
        field="recipeName"
        suggestion="Improved pasta dish"
        currentValue="Old pasta"
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    const strikethrough = screen.getByText('Old pasta')
    expect(strikethrough.tagName).toBe('S')
    expect(screen.getByText('Improved pasta dish')).toBeInTheDocument()
  })

  it('does not show strikethrough when currentValue is empty', () => {
    const { container } = render(
      <FieldAISuggestionChip
        field="recipeName"
        suggestion="New pasta dish"
        currentValue=""
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(container.querySelector('s')).not.toBeInTheDocument()
    expect(screen.getByText('New pasta dish')).toBeInTheDocument()
  })
})

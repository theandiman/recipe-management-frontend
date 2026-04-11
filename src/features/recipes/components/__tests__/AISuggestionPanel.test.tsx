import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AISuggestionPanel } from '../AISuggestionPanel'
import type { FieldSuggestion } from '../../hooks/useAISuggestions'

const mockSuggestions: FieldSuggestion[] = [
  { field: 'description', suggestedValue: 'A delicious pasta dish', reason: 'No description provided' },
  { field: 'prepTime', suggestedValue: '15', reason: 'No prep time set' },
]

describe('AISuggestionPanel', () => {
  it('renders nothing when status is idle', () => {
    const { container } = render(
      <AISuggestionPanel
        suggestions={[]}
        status="idle"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows loading state when status is loading', () => {
    render(
      <AISuggestionPanel
        suggestions={[]}
        status="loading"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
      />
    )
    expect(screen.getByText(/analysing your recipe/i)).toBeInTheDocument()
  })

  it('shows error message when status is error', () => {
    render(
      <AISuggestionPanel
        suggestions={[]}
        status="error"
        error="Network error occurred"
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
      />
    )
    expect(screen.getByText(/Network error occurred/i)).toBeInTheDocument()
  })

  it('shows retry button when status is error and onRetry is provided', () => {
    const onRetry = vi.fn()
    render(
      <AISuggestionPanel
        suggestions={[]}
        status="error"
        error="Something went wrong"
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
        onRetry={onRetry}
      />
    )
    const retryBtn = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('shows "all fields look good" when status is success and no suggestions', () => {
    render(
      <AISuggestionPanel
        suggestions={[]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
      />
    )
    expect(screen.getByText(/all fields look good/i)).toBeInTheDocument()
  })

  it('renders suggestion cards with apply and dismiss buttons', () => {
    const fieldSetters = {
      description: vi.fn(),
      prepTime: vi.fn(),
    }
    render(
      <AISuggestionPanel
        suggestions={mockSuggestions}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={fieldSetters}
      />
    )
    // Both suggestion values should be visible
    expect(screen.getByText(/A delicious pasta dish/i)).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()

    // Apply and Dismiss buttons for each field
    expect(screen.getAllByRole('button', { name: /apply ai suggestion/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /dismiss ai suggestion/i })).toHaveLength(2)
  })

  it('calls onApply with field name and setter when Apply is clicked', () => {
    const setter = vi.fn()
    const onApply = vi.fn()
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={onApply}
        onDismiss={vi.fn()}
        fieldSetters={{ description: setter }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /apply ai suggestion for description/i }))
    expect(onApply).toHaveBeenCalledWith('description', setter, expect.any(String))
  })

  it('calls onDismiss with field name when Dismiss is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={onDismiss}
        fieldSetters={{ description: vi.fn() }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /dismiss ai suggestion for description/i }))
    expect(onDismiss).toHaveBeenCalledWith('description')
  })

  it('shows the ✨ icon to visually distinguish AI suggestions', () => {
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{ description: vi.fn() }}
      />
    )
    // The panel header has ✨ and each card value also has ✨
    const sparkles = screen.getAllByText(/✨/)
    expect(sparkles.length).toBeGreaterThan(0)
  })

  it('collapses and expands on header button click', () => {
    render(
      <AISuggestionPanel
        suggestions={mockSuggestions}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{ description: vi.fn(), prepTime: vi.fn() }}
      />
    )
    // Panel starts expanded — suggestions visible
    expect(screen.getByText(/A delicious pasta dish/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /AI Suggestions/i }))

    // After collapse suggestions should not be visible
    expect(screen.queryByText(/A delicious pasta dish/i)).not.toBeInTheDocument()
  })

  it('shows field count badge when suggestions are present', () => {
    render(
      <AISuggestionPanel
        suggestions={mockSuggestions}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
      />
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not show Apply button when no setter is available for a field', () => {
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}} // no setter for description
      />
    )
    expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
  })
})

// ─── Before/After comparison (issue #38) ─────────────────────────────────────

describe('Before/after comparison', () => {
  it('shows current value when currentValues prop is provided', () => {
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{ description: vi.fn() }}
        currentValues={{ description: 'Old description text' }}
      />
    )
    expect(screen.getByLabelText(/Current value: Old description text/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Suggested value: A delicious pasta dish/i)).toBeInTheDocument()
  })

  it('does NOT show current value row when currentValues is absent', () => {
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{ description: vi.fn() }}
      />
    )
    expect(screen.queryByLabelText(/Current value:/i)).not.toBeInTheDocument()
  })

  it('does NOT show current value row when value for that field is empty string', () => {
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{ description: vi.fn() }}
        currentValues={{ description: '' }}
      />
    )
    expect(screen.queryByLabelText(/Current value:/i)).not.toBeInTheDocument()
  })

  it('passes current value as previousValue to onApply for audit trail', () => {
    const setter = vi.fn()
    const onApply = vi.fn()
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={onApply}
        onDismiss={vi.fn()}
        fieldSetters={{ description: setter }}
        currentValues={{ description: 'My current description' }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /apply ai suggestion for description/i }))
    expect(onApply).toHaveBeenCalledWith('description', setter, 'My current description')
  })
})

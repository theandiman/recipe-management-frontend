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
    expect(screen.getByText(/reviewing fields for suggestions/i)).toBeInTheDocument()
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

  it('auto-collapses (shows only header) when status is success and no suggestions', () => {
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
    expect(screen.getByRole('button', { name: /AI Suggestions/i })).toBeInTheDocument()
    expect(screen.queryByText(/all fields look good/i)).not.toBeInTheDocument()
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

  it('shows AI labels that distinguish current and suggested values', () => {
    render(
      <AISuggestionPanel
        suggestions={[mockSuggestions[0]]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{ description: vi.fn() }}
        currentValues={{ description: 'Existing description' }}
      />
    )
    expect(screen.getByText(/AI Suggestions/i)).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('Suggested')).toBeInTheDocument()
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

// ─── Step-scoped suggestions (issue #45) ─────────────────────────────────────────────

const stepSuggestions: FieldSuggestion[] = [
  { field: 'recipeName', suggestedValue: 'Better Recipe Name', reason: 'Too generic' },
  { field: 'description', suggestedValue: 'A rich description', reason: 'Too short' },
  { field: 'prepTime', suggestedValue: '20', reason: 'Missing prep time' },
  { field: 'cookTime', suggestedValue: '30', reason: 'Missing cook time' },
  { field: 'servings', suggestedValue: '4', reason: 'Missing servings' },
  { field: 'tags', suggestedValue: 'Italian', reason: 'No tags' },
]

describe('AISuggestionPanel — step scoping', () => {
  it('filters to step 1 fields (recipeName, description) when currentStep=1', () => {
    render(
      <AISuggestionPanel
        suggestions={stepSuggestions}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
        currentStep={1}
      />
    )
    expect(screen.getByText(/Better Recipe Name/i)).toBeInTheDocument()
    expect(screen.getByText(/A rich description/i)).toBeInTheDocument()
    expect(screen.queryByText(/Missing prep time/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Missing cook time/i)).not.toBeInTheDocument()
  })

  it('shows step 4 fields (prepTime, cookTime, servings, tags) when currentStep=4', () => {
    render(
      <AISuggestionPanel
        suggestions={stepSuggestions}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
        currentStep={4}
      />
    )
    expect(screen.getByText(/Missing prep time/i)).toBeInTheDocument()
    expect(screen.getByText(/Missing cook time/i)).toBeInTheDocument()
    expect(screen.getByText(/Missing servings/i)).toBeInTheDocument()
    expect(screen.getByText(/No tags/i)).toBeInTheDocument()
    expect(screen.queryByText(/Better Recipe Name/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/A rich description/i)).not.toBeInTheDocument()
  })

  it('shows all suggestions when currentStep is not provided', () => {
    render(
      <AISuggestionPanel
        suggestions={stepSuggestions}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
      />
    )
    expect(screen.getByText(/Better Recipe Name/i)).toBeInTheDocument()
    expect(screen.getByText(/A rich description/i)).toBeInTheDocument()
    expect(screen.getByText(/Missing prep time/i)).toBeInTheDocument()
  })

  it('auto-collapses panel body when success + 0 visible suggestions after step filter', () => {
    render(
      <AISuggestionPanel
        suggestions={[
          { field: 'prepTime', suggestedValue: '20', reason: 'Missing prep time' },
        ]}
        status="success"
        error={null}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        fieldSetters={{}}
        currentStep={1}
      />
    )
    expect(screen.queryByText(/Missing prep time/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /AI Suggestions/i })).toBeInTheDocument()
  })
})

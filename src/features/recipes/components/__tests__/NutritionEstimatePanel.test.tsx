import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NutritionEstimatePanel } from '../NutritionEstimatePanel'
import type { NutritionEstimateResponse } from '../../hooks/useNutritionEstimate'

const makeEstimate = (partial = false, warnings: string[] = []) => ({
  perServing: {
    calories: { value: 350, unit: 'kcal', estimated: false },
    protein:  { value: 12, unit: 'g', estimated: false },
    carbs:    { value: 45, unit: 'g', estimated: false },
    fat:      { value: 10, unit: 'g', estimated: false },
    fiber:    { value: 4, unit: 'g', estimated: false },
    warnings,
    isPartial: partial,
  },
  wholeRecipe: {
    calories: { value: 700, unit: 'kcal', estimated: false },
    protein:  { value: 24, unit: 'g', estimated: false },
    carbs:    { value: 90, unit: 'g', estimated: false },
    fat:      { value: 20, unit: 'g', estimated: false },
    fiber:    { value: 8, unit: 'g', estimated: false },
    warnings,
    isPartial: partial,
  },
}) satisfies NutritionEstimateResponse

describe('NutritionEstimatePanel', () => {
  it('renders nothing when estimate is null and not loading', () => {
    const { container } = render(
      <NutritionEstimatePanel
        estimate={null}
        loadingState="idle"
        error={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows loading message when loading', () => {
    render(
      <NutritionEstimatePanel
        estimate={null}
        loadingState="loading"
        error={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(screen.getByText(/estimating nutrition/i)).toBeInTheDocument()
  })

  it('shows error message and dismiss button on error', () => {
    const onDismiss = vi.fn()
    render(
      <NutritionEstimatePanel
        estimate={null}
        loadingState="error"
        error="Network failed"
        onAccept={vi.fn()}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByText(/network failed/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/dismiss/i))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('shows fallback error message when error prop is null', () => {
    render(
      <NutritionEstimatePanel
        estimate={null}
        loadingState="error"
        error={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(screen.getByText(/could not estimate nutrition/i)).toBeInTheDocument()
  })

  it('renders nutrient table with per-serving and whole-recipe values', () => {
    render(
      <NutritionEstimatePanel
        estimate={makeEstimate()}
        loadingState="success"
        error={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(screen.getByText('Calories')).toBeInTheDocument()
    expect(screen.getByText('350kcal')).toBeInTheDocument()
    expect(screen.getByText('700kcal')).toBeInTheDocument()
  })

  it('shows an understated AI estimate label in the header', () => {
    render(
      <NutritionEstimatePanel
        estimate={makeEstimate()}
        loadingState="success"
        error={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText('AI estimate')).toBeInTheDocument()
  })

  it('includes dark mode styles on the success panel', () => {
    const { container } = render(
      <NutritionEstimatePanel
        estimate={makeEstimate()}
        loadingState="success"
        error={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    expect(container.firstChild).toHaveClass('dark:bg-gray-900', 'dark:border-gray-700')
    expect(screen.getByText('Calories')).toHaveClass('dark:text-gray-300')
  })

  it('shows partial indicator and warnings when isPartial is true', () => {
    render(
      <NutritionEstimatePanel
        estimate={makeEstimate(true, ["Unknown: mystery powder"])}
        loadingState="success"
        error={null}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(screen.getByText(/partial/i)).toBeInTheDocument()
    expect(screen.getByText(/unknown: mystery powder/i)).toBeInTheDocument()
  })

  it('calls onAccept when Accept is clicked', () => {
    const onAccept = vi.fn()
    render(
      <NutritionEstimatePanel
        estimate={makeEstimate()}
        loadingState="success"
        error={null}
        onAccept={onAccept}
        onDismiss={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('Accept'))
    expect(onAccept).toHaveBeenCalled()
  })

  it('calls onDismiss when Dismiss is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <NutritionEstimatePanel
        estimate={makeEstimate()}
        loadingState="success"
        error={null}
        onAccept={vi.fn()}
        onDismiss={onDismiss}
      />
    )
    fireEvent.click(screen.getByText('Dismiss'))
    expect(onDismiss).toHaveBeenCalled()
  })
})

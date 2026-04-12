import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FieldAIEnhanceButton } from '../FieldAIEnhanceButton'

describe('FieldAIEnhanceButton', () => {
  it('renders a sparkle icon button', () => {
    render(
      <FieldAIEnhanceButton
        field="recipeName"
        currentValue=""
        status="idle"
        onEnhance={vi.fn()}
      />
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('✨')).toBeInTheDocument()
  })

  it('has aria-label "Complete with AI" when currentValue is empty', () => {
    render(
      <FieldAIEnhanceButton
        field="recipeName"
        currentValue=""
        status="idle"
        onEnhance={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Complete with AI' })).toBeInTheDocument()
  })

  it('has aria-label "Enhance with AI" when currentValue is non-empty', () => {
    render(
      <FieldAIEnhanceButton
        field="recipeName"
        currentValue="My Recipe"
        status="idle"
        onEnhance={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Enhance with AI' })).toBeInTheDocument()
  })

  it('shows a spinner when status is loading', () => {
    render(
      <FieldAIEnhanceButton
        field="recipeName"
        currentValue=""
        status="loading"
        onEnhance={vi.fn()}
      />
    )
    expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('button is disabled when status is loading', () => {
    render(
      <FieldAIEnhanceButton
        field="recipeName"
        currentValue=""
        status="loading"
        onEnhance={vi.fn()}
      />
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onEnhance when clicked', () => {
    const onEnhance = vi.fn()
    render(
      <FieldAIEnhanceButton
        field="recipeName"
        currentValue="test"
        status="idle"
        onEnhance={onEnhance}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onEnhance).toHaveBeenCalledOnce()
  })

  it('does not call onEnhance when disabled (loading)', () => {
    const onEnhance = vi.fn()
    render(
      <FieldAIEnhanceButton
        field="recipeName"
        currentValue=""
        status="loading"
        onEnhance={onEnhance}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onEnhance).not.toHaveBeenCalled()
  })
})

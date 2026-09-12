import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ViewModeToggle } from './ViewModeToggle'

describe('ViewModeToggle', () => {
  it('renders Grid and List buttons with appropriate aria attributes', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="grid" onViewModeChange={onChange} />)

    const gridBtn = screen.getByRole('button', { name: /Grid/i })
    const listBtn = screen.getByRole('button', { name: /List/i })

    expect(gridBtn).toBeInTheDocument()
    expect(listBtn).toBeInTheDocument()

    expect(gridBtn).toHaveAttribute('aria-pressed', 'true')
    expect(listBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onViewModeChange with "list" when List button is clicked', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="grid" onViewModeChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /List/i }))
    expect(onChange).toHaveBeenCalledWith('list')
  })

  it('calls onViewModeChange with "grid" when Grid button is clicked', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="list" onViewModeChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Grid/i }))
    expect(onChange).toHaveBeenCalledWith('grid')
  })

  it('renders without text labels when showLabels is false', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="grid" onViewModeChange={onChange} showLabels={false} />)

    expect(screen.queryByText('Grid')).not.toBeInTheDocument()
    expect(screen.queryByText('List')).not.toBeInTheDocument()
    expect(screen.getByTitle('Grid View')).toBeInTheDocument()
    expect(screen.getByTitle('List View')).toBeInTheDocument()
  })
})

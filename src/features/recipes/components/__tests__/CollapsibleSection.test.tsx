import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CollapsibleSection } from '../CollapsibleSection'

describe('CollapsibleSection', () => {
  const defaultProps = {
    title: 'Timing',
    icon: '⏱',
    isOpen: false,
    onToggle: vi.fn(),
    children: <div>Section content</div>,
  }

  it('renders the section title and icon', () => {
    render(<CollapsibleSection {...defaultProps} />)
    expect(screen.getByText('Timing')).toBeInTheDocument()
    expect(screen.getByText('⏱')).toBeInTheDocument()
  })

  it('hides content when closed', () => {
    const { container } = render(<CollapsibleSection {...defaultProps} isOpen={false} />)
    // The content wrapper carries the `hidden` attribute when closed.
    const hiddenDiv = container.querySelector('[hidden]')
    expect(hiddenDiv).toBeTruthy()
    expect(hiddenDiv).toHaveTextContent('Section content')
  })

  it('shows content when open', () => {
    render(<CollapsibleSection {...defaultProps} isOpen={true} />)
    const content = screen.getByText('Section content').closest('div')
    expect(content).not.toHaveAttribute('hidden')
  })

  it('calls onToggle when the header button is clicked', () => {
    const onToggle = vi.fn()
    render(<CollapsibleSection {...defaultProps} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('sets aria-expanded=false when closed', () => {
    render(<CollapsibleSection {...defaultProps} isOpen={false} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('sets aria-expanded=true when open', () => {
    render(<CollapsibleSection {...defaultProps} isOpen={true} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })

  it('does not show filled badge when isFilled is false', () => {
    render(<CollapsibleSection {...defaultProps} isFilled={false} />)
    expect(screen.queryByText(/Filled/i)).not.toBeInTheDocument()
  })

  it('shows filled badge when isFilled=true and section is closed', () => {
    render(<CollapsibleSection {...defaultProps} isOpen={false} isFilled={true} />)
    expect(screen.getByText(/✓ Filled/i)).toBeInTheDocument()
  })

  it('does NOT show filled badge when isFilled=true but section is open', () => {
    render(<CollapsibleSection {...defaultProps} isOpen={true} isFilled={true} />)
    // Badge is suppressed when the section is already open
    expect(screen.queryByText(/✓ Filled/i)).not.toBeInTheDocument()
  })

  it('passes data-testid to the root element', () => {
    render(<CollapsibleSection {...defaultProps} data-testid="section-timing" />)
    expect(document.querySelector('[data-testid="section-timing"]')).toBeInTheDocument()
  })
})

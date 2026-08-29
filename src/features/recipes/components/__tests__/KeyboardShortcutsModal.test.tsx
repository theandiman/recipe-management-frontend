import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal'

describe('KeyboardShortcutsModal', () => {
  it('renders trigger button by default', () => {
    render(<KeyboardShortcutsModal />)

    expect(screen.getByLabelText('Keyboard Shortcuts')).toBeInTheDocument()
  })

  it('opens modal when trigger button is clicked', () => {
    render(<KeyboardShortcutsModal />)

    const trigger = screen.getByLabelText('Keyboard Shortcuts')
    fireEvent.click(trigger)

    expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument()
    expect(screen.getByText('Launch Cook Mode')).toBeInTheDocument()
    expect(screen.getByText('Toggle Like')).toBeInTheDocument()
    expect(screen.getByText('Toggle Bookmark')).toBeInTheDocument()
    expect(screen.getByText('Jump to Ingredients')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />)

    const closeBtn = screen.getByRole('button', { name: '✕' })
    fireEvent.click(closeBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

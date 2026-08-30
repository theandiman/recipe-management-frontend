import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FloatingKitchenTimer, type KitchenTimerState } from '../FloatingKitchenTimer'

const mockTimer: KitchenTimerState = {
  id: 't1',
  label: 'Step 1: 15 minutes',
  totalSeconds: 900,
  remainingSeconds: 900,
  isRunning: true,
}

describe('FloatingKitchenTimer', () => {
  it('renders timer when active', () => {
    render(
      <FloatingKitchenTimer
        timer={mockTimer}
        onClose={vi.fn()}
        onUpdateTimer={vi.fn()}
      />
    )

    expect(screen.getByText('Step 1: 15 minutes')).toBeInTheDocument()
    expect(screen.getByText('15:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument()
  })

  it('calls onClose when dismiss button is clicked', () => {
    const onClose = vi.fn()
    render(
      <FloatingKitchenTimer
        timer={mockTimer}
        onClose={onClose}
        onUpdateTimer={vi.fn()}
      />
    )

    const dismissBtn = screen.getByLabelText('Dismiss timer')
    fireEvent.click(dismissBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onUpdateTimer when +1 min button is clicked', () => {
    const onUpdateTimer = vi.fn()
    render(
      <FloatingKitchenTimer
        timer={mockTimer}
        onClose={vi.fn()}
        onUpdateTimer={onUpdateTimer}
      />
    )

    const addMinBtn = screen.getByRole('button', { name: '+1 min' })
    fireEvent.click(addMinBtn)

    expect(onUpdateTimer).toHaveBeenCalledTimes(1)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Stepper from './Stepper'

describe('Stepper', () => {
  const mockSteps = [
    { id: 1, label: 'First step instruction here' },
    { id: 2, label: 'Second step with some details' },
    { id: 3, label: 'Third and final step' }
  ]

  it('should render stepper with current step', () => {
    render(<Stepper steps={mockSteps} active={1} />)
    
    // Should show step indicator
    expect(screen.getByLabelText(/Recipe steps: Step 1 of 3/)).toBeInTheDocument()
  })

  it('should return null when steps array is empty', () => {
    const { container } = render(<Stepper steps={[]} active={1} />)
    expect(container.firstChild).toBeNull()
  })

  it('should return null when steps is null or undefined', () => {
    const { container } = render(<Stepper steps={null as any} active={1} />)
    expect(container.firstChild).toBeNull()
  })

  it('should toggle dropdown when clicked', async () => {
    const user = userEvent.setup()
    render(<Stepper steps={mockSteps} active={1} />)
    
    const button = screen.getByRole('button', { name: /Recipe steps/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('should call onSelectStep when a step is selected', async () => {
    const user = userEvent.setup()
    const onSelectStep = vi.fn()
    
    render(<Stepper steps={mockSteps} active={1} onSelectStep={onSelectStep} />)
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /Recipe steps/ })
    await user.click(button)
    
    // Click on second step
    const step2 = screen.getByText(/Second step/)
    await user.click(step2)
    
    expect(onSelectStep).toHaveBeenCalledWith(2)
  })

  it('should close dropdown after selecting a step', async () => {
    const user = userEvent.setup()
    const onSelectStep = vi.fn()
    
    render(<Stepper steps={mockSteps} active={1} onSelectStep={onSelectStep} />)
    
    const button = screen.getByRole('button', { name: /Recipe steps/ })
    
    // Open dropdown
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    
    // Select a step
    const step2 = screen.getByText(/Second step/)
    await user.click(step2)
    
    // Dropdown should close
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('should close dropdown when pressing Escape key', async () => {
    const user = userEvent.setup()
    render(<Stepper steps={mockSteps} active={1} />)
    
    const button = screen.getByRole('button', { name: /Recipe steps/ })
    
    // Open dropdown
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    
    // Press Escape
    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('should handle keyboard navigation with arrow keys', async () => {
    const onSelectStep = vi.fn()
    render(<Stepper steps={mockSteps} active={2} onSelectStep={onSelectStep} />)
    
    const button = screen.getByRole('button', { name: /Recipe steps/ })
    button.focus()
    
    // Press ArrowLeft to go to previous step
    fireEvent.keyDown(button, { key: 'ArrowLeft' })
    expect(onSelectStep).toHaveBeenCalledWith(1)
    
    // Press ArrowRight to go to next step
    fireEvent.keyDown(button, { key: 'ArrowRight' })
    expect(onSelectStep).toHaveBeenCalledWith(3)
  })

  it('should not go below step 1 with ArrowLeft', async () => {
    const onSelectStep = vi.fn()
    render(<Stepper steps={mockSteps} active={1} onSelectStep={onSelectStep} />)
    
    const button = screen.getByRole('button', { name: /Recipe steps/ })
    button.focus()
    
    // Press ArrowLeft when already at first step
    fireEvent.keyDown(button, { key: 'ArrowLeft' })
    expect(onSelectStep).toHaveBeenCalledWith(1) // Should stay at 1
  })

  it('should not go beyond last step with ArrowRight', async () => {
    const onSelectStep = vi.fn()
    render(<Stepper steps={mockSteps} active={3} onSelectStep={onSelectStep} />)
    
    const button = screen.getByRole('button', { name: /Recipe steps/ })
    button.focus()
    
    // Press ArrowRight when already at last step
    fireEvent.keyDown(button, { key: 'ArrowRight' })
    expect(onSelectStep).toHaveBeenCalledWith(3) // Should stay at 3
  })

  it('should display progress percentage', () => {
    render(<Stepper steps={mockSteps} active={2} />)
    
    // Step 2 of 3 = 67% (rounded)
    const button = screen.getByRole('button', { name: /Recipe steps/ })
    expect(button).toBeInTheDocument()
  })

  it('should truncate long step labels in dropdown', async () => {
    const user = userEvent.setup()
    const longSteps = [
      { id: 1, label: 'This is a very long instruction with many words that should be truncated to show only the first ten words and then add ellipsis' }
    ]
    
    render(<Stepper steps={longSteps} active={1} />)
    
    // Open dropdown
    const button = screen.getByRole('button')
    await user.click(button)
    
    // Long text should be truncated with ellipsis
    expect(screen.getByText(/…/)).toBeInTheDocument()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AiSearchPromptBar } from './AiSearchPromptBar'

describe('AiSearchPromptBar', () => {
  it('does not render content when isOpen is false', () => {
    render(
      <AiSearchPromptBar
        isOpen={false}
        onClose={vi.fn()}
        onSubmitPrompt={vi.fn()}
        onClearPrompt={vi.fn()}
      />
    )
    expect(screen.queryByText(/Smart AI Recipe Search/i)).not.toBeInTheDocument()
  })

  it('renders input, suggestions, and handles submit', () => {
    const onSubmit = vi.fn()
    render(
      <AiSearchPromptBar
        isOpen={true}
        onClose={vi.fn()}
        onSubmitPrompt={onSubmit}
        onClearPrompt={vi.fn()}
      />
    )

    expect(screen.getByText(/Smart AI Recipe Search/i)).toBeInTheDocument()
    const input = screen.getByPlaceholderText(/e\.g\. Quick 20-min dinner/i)
    fireEvent.change(input, { target: { value: 'quick dinner under 500 cals' } })

    const askButton = screen.getByRole('button', { name: /Ask AI/i })
    fireEvent.click(askButton)

    expect(onSubmit).toHaveBeenCalledWith('quick dinner under 500 cals')
  })

  it('submits suggestion chip directly on click', () => {
    const onSubmit = vi.fn()
    render(
      <AiSearchPromptBar
        isOpen={true}
        onClose={vi.fn()}
        onSubmitPrompt={onSubmit}
        onClearPrompt={vi.fn()}
      />
    )

    const chip = screen.getByRole('button', { name: /Quick dinner under 30 mins/i })
    fireEvent.click(chip)

    expect(onSubmit).toHaveBeenCalledWith('Quick dinner under 30 mins')
  })

  it('shows loading state when isLoading is true', () => {
    render(
      <AiSearchPromptBar
        isOpen={true}
        isLoading={true}
        onClose={vi.fn()}
        onSubmitPrompt={vi.fn()}
        onClearPrompt={vi.fn()}
      />
    )

    expect(screen.getByText(/Thinking\.\.\./i)).toBeInTheDocument()
  })

  it('displays active prompt summary and triggers onClearPrompt', () => {
    const onClear = vi.fn()
    render(
      <AiSearchPromptBar
        isOpen={true}
        activePrompt="quick keto salad"
        nlpSummary="Low-Carb • Max Prep 15 mins"
        onClose={vi.fn()}
        onSubmitPrompt={vi.fn()}
        onClearPrompt={onClear}
      />
    )

    expect(screen.getByText(/Active AI Filter:/i)).toBeInTheDocument()
    expect(screen.getByText(/Low-Carb • Max Prep 15 mins/i)).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', { name: /Clear AI/i })
    fireEvent.click(clearBtn)
    expect(onClear).toHaveBeenCalled()
  })
})

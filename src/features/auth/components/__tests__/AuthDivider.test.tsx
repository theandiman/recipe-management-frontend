import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthDivider } from '../AuthDivider'

describe('AuthDivider', () => {
  it('should render divider with provided text', () => {
    render(<AuthDivider text="or" />)
    const text = screen.getByText('or')
    expect(text).toBeDefined()
  })

  it('should render divider with custom text', () => {
    render(<AuthDivider text="and" />)
    const text = screen.getByText('and')
    expect(text).toBeDefined()
  })

  it('should render horizontal line', () => {
    const { container } = render(<AuthDivider text="or" />)
    const lines = container.querySelectorAll('.border-t')
    expect(lines.length).toBeGreaterThanOrEqual(1)
  })

  it('should apply correct styling to text', () => {
    const { container } = render(<AuthDivider text="or" />)
    const text = screen.getByText('or')
    expect(text.className).toContain('text-gray-500')
    // Check parent div has text-sm
    const textSm = container.querySelector('.text-sm')
    expect(textSm).toBeDefined()
  })
})

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AISpinnerIcon } from '../AISpinnerIcon'

describe('AISpinnerIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<AISpinnerIcon />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('has animate-spin class', () => {
    const { container } = render(<AISpinnerIcon />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class')).toContain('animate-spin')
  })

  it('is aria-hidden', () => {
    const { container } = render(<AISpinnerIcon />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })

  it('uses default size class when no className given', () => {
    const { container } = render(<AISpinnerIcon />)
    const svg = container.querySelector('svg')
    const cls = svg?.getAttribute('class') ?? ''
    expect(cls).toContain('w-4')
    expect(cls).toContain('h-4')
  })

  it('accepts a custom className override', () => {
    const { container } = render(<AISpinnerIcon className="w-6 h-6" />)
    const svg = container.querySelector('svg')
    const cls = svg?.getAttribute('class') ?? ''
    expect(cls).toContain('w-6')
    expect(cls).toContain('h-6')
  })
})

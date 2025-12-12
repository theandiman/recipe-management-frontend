import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorAlert } from '../ErrorAlert'

describe('ErrorAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render error message when error is provided', () => {
    render(<ErrorAlert error="Something went wrong" />)
    const error = screen.getByText('Something went wrong')
    expect(error).toBeInTheDocument()
  })

  it('should not render when error is null', () => {
    const { container } = render(<ErrorAlert error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('should not render when error is undefined', () => {
    const { container } = render(<ErrorAlert error={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('should apply correct error styling', () => {
    render(<ErrorAlert error="Error occurred" />)
    const alert = screen.getByText('Error occurred')
    expect(alert).toBeInTheDocument()
    expect(alert.className).toContain('bg-red-50')
  })

  it('should display error text in red', () => {
    render(<ErrorAlert error="Error occurred" />)
    const error = screen.getByText('Error occurred')
    expect(error.className).toContain('text-red-800')
  })
})

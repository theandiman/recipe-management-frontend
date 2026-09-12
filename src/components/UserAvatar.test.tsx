import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserAvatar } from './UserAvatar'

describe('UserAvatar', () => {
  it('renders image when src is provided', () => {
    render(<UserAvatar src="https://example.com/photo.jpg" name="Alice" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(img).toHaveAttribute('alt', 'Alice')
  })

  it('renders initial fallback when src is not provided', () => {
    render(<UserAvatar name="Bob Smith" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('renders "U" fallback when name is null or undefined or whitespace', () => {
    render(<UserAvatar />)
    expect(screen.getByText('U')).toBeInTheDocument()

    const { unmount } = render(<UserAvatar name="   " />)
    expect(screen.getAllByText('U').length).toBeGreaterThanOrEqual(1)
    unmount()
  })

  it('falls back to initial when image fails to load', () => {
    render(<UserAvatar src="https://example.com/broken.jpg" name="Charlie" />)
    const img = screen.getByRole('img')
    fireEvent.error(img)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('resets error state when src changes', () => {
    const { rerender } = render(<UserAvatar src="https://example.com/broken.jpg" name="Diana" />)
    const img = screen.getByRole('img')
    fireEvent.error(img)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    rerender(<UserAvatar src="https://example.com/fixed.jpg" name="Diana" />)
    const newImg = screen.getByRole('img')
    expect(newImg).toBeInTheDocument()
    expect(newImg).toHaveAttribute('src', 'https://example.com/fixed.jpg')
  })

  it('applies the appropriate size class', () => {
    const { container: c1 } = render(<UserAvatar name="Small" size="xs" />)
    expect(c1.firstChild).toHaveClass('w-6', 'h-6')

    const { container: c2 } = render(<UserAvatar name="Large" size="lg" />)
    expect(c2.firstChild).toHaveClass('w-10', 'h-10')

    const { container: c3 } = render(<UserAvatar name="ExtraLarge" size="xl" />)
    expect(c3.firstChild).toHaveClass('w-20', 'h-20')
  })

  it('applies custom className and data-testid', () => {
    render(<UserAvatar name="Test" className="border-2 border-red-500" data-testid="avatar-test" />)
    const avatar = screen.getByTestId('avatar-test')
    expect(avatar).toHaveClass('border-2', 'border-red-500')
  })
})

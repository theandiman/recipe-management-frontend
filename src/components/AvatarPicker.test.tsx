import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvatarPicker } from './AvatarPicker'

describe('AvatarPicker', () => {
  it('exposes an accessible file input and returns the selected image to its owner', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const image = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    render(
      <AvatarPicker
        displayName="Jane Chef"
        avatarUrl="https://example.test/avatar.png"
        onSelect={onSelect}
        onRemove={vi.fn()}
      />,
    )

    await user.upload(screen.getByLabelText('Choose profile picture'), image)

    expect(screen.getByRole('img', { name: 'Jane Chef' })).toHaveAttribute(
      'src',
      'https://example.test/avatar.png',
    )
    expect(onSelect).toHaveBeenCalledWith(image)
  })

  it('provides an accessible removal action', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <AvatarPicker
        displayName="Jane Chef"
        avatarUrl="https://example.test/avatar.png"
        onSelect={vi.fn()}
        onRemove={onRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove profile picture' }))

    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('renders an initial-based fallback when no avatar URL is supplied', () => {
    render(
      <AvatarPicker
        displayName="Jane Chef"
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText('J')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove profile picture' })).not.toBeInTheDocument()
  })

  it('announces an actionable error when an owner upload handler fails', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn().mockRejectedValue(new Error('Unable to upload the avatar. Please try again.'))

    render(
      <AvatarPicker
        displayName="Jane Chef"
        onSelect={onSelect}
        onRemove={vi.fn()}
      />,
    )

    await user.upload(
      screen.getByLabelText('Choose profile picture'),
      new File(['avatar'], 'avatar.png', { type: 'image/png' }),
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to upload the avatar. Please try again.')
    })
  })
})

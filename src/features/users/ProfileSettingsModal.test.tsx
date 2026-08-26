import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileSettingsModal } from './ProfileSettingsModal'
import * as userApi from '../../services/userApi'
import * as imageStorage from '../../utils/imageStorage'
import type { UserProfile } from '../../services/userApi'

vi.mock('../../services/userApi', () => ({
  updateMyProfile: vi.fn(),
}))

vi.mock('../../utils/imageStorage', () => ({
  uploadAvatarImage: vi.fn(),
  deleteAvatarImage: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}))

const mockProfile: UserProfile = {
  uid: 'uid-123',
  displayName: 'Jane Chef',
  bio: 'Cooking lover',
  visibility: 'PUBLIC',
  avatarUrl: 'https://example.com/avatar.jpg',
  publicRecipeCount: 5,
  publicRecipes: [],
}

describe('ProfileSettingsModal', () => {
  const mockOnClose = vi.fn()
  const mockOnProfileUpdated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal with initial profile data', () => {
    render(
      <ProfileSettingsModal
        profile={mockProfile}
        onClose={mockOnClose}
        onProfileUpdated={mockOnProfileUpdated}
      />
    )

    expect(screen.getByRole('dialog', { name: 'Edit Profile' })).toBeInTheDocument()
    expect(screen.getByLabelText('Display Name')).toHaveValue('Jane Chef')
    expect(screen.getByLabelText('Bio')).toHaveValue('Cooking lover')
    expect(screen.getByRole('button', { name: 'Remove photo' })).toBeInTheDocument()
  })

  it('allows updating fields and submitting form', async () => {
    const user = userEvent.setup()
    const updatedProfile: UserProfile = {
      ...mockProfile,
      displayName: 'Jane Master Chef',
      bio: 'New bio content',
      visibility: 'PRIVATE',
    }
    vi.spyOn(userApi, 'updateMyProfile').mockResolvedValue(updatedProfile)

    render(
      <ProfileSettingsModal
        profile={mockProfile}
        onClose={mockOnClose}
        onProfileUpdated={mockOnProfileUpdated}
      />
    )

    const nameInput = screen.getByLabelText('Display Name')
    const bioInput = screen.getByLabelText('Bio')
    const privateBtn = screen.getByRole('button', { name: /private/i })

    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Master Chef')
    await user.clear(bioInput)
    await user.type(bioInput, 'New bio content')
    await user.click(privateBtn)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(userApi.updateMyProfile).toHaveBeenCalledWith({
        displayName: 'Jane Master Chef',
        bio: 'New bio content',
        visibility: 'PRIVATE',
        avatarUrl: 'https://example.com/avatar.jpg',
      })
    })

    expect(mockOnProfileUpdated).toHaveBeenCalledWith(updatedProfile)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('validates display name is not empty', async () => {
    const user = userEvent.setup()

    render(
      <ProfileSettingsModal
        profile={mockProfile}
        onClose={mockOnClose}
        onProfileUpdated={mockOnProfileUpdated}
      />
    )

    const nameInput = screen.getByLabelText('Display Name')
    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(userApi.updateMyProfile).not.toHaveBeenCalled()
  })

  it('handles avatar removal', async () => {
    const user = userEvent.setup()
    vi.spyOn(imageStorage, 'deleteAvatarImage').mockResolvedValue(undefined)

    render(
      <ProfileSettingsModal
        profile={mockProfile}
        onClose={mockOnClose}
        onProfileUpdated={mockOnProfileUpdated}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Remove photo' }))

    await waitFor(() => {
      expect(imageStorage.deleteAvatarImage).toHaveBeenCalledWith('uid-123')
    })
    expect(screen.queryByRole('button', { name: 'Remove photo' })).not.toBeInTheDocument()
  })

  it('closes modal when close button or Cancel is clicked', async () => {
    const user = userEvent.setup()

    render(
      <ProfileSettingsModal
        profile={mockProfile}
        onClose={mockOnClose}
        onProfileUpdated={mockOnProfileUpdated}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Close modal' }))
    expect(mockOnClose).toHaveBeenCalledTimes(2)
  })
})

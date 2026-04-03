import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { UserProfilePage } from './UserProfilePage'
import * as userApi from '../../services/userApi'
import type { UserProfile } from '../../services/userApi'
import type { Recipe } from '../../types/nutrition'

vi.mock('../../services/userApi', () => ({
  getUserProfile: vi.fn(),
}))

const mockRecipe: Recipe = {
  id: 'r1',
  recipeName: 'Pasta Carbonara',
  description: 'A classic Italian dish',
  servings: 2,
  ingredients: [],
  instructions: [],
  userId: 'uid-123',
  source: 'manual',
  isPublic: true,
}

const mockProfile: UserProfile = {
  uid: 'uid-123',
  displayName: 'Jane Chef',
  bio: 'I love cooking Italian food!',
  publicRecipeCount: 1,
  publicRecipes: [mockRecipe],
}

const renderAtUid = (uid = 'uid-123') =>
  render(
    <MemoryRouter initialEntries={[`/user/${uid}`]}>
      <Routes>
        <Route path="/user/:uid" element={<UserProfilePage />} />
        <Route path="/dashboard/recipes/:id" element={<div>Recipe detail</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching profile', () => {
    vi.spyOn(userApi, 'getUserProfile').mockImplementation(() => new Promise(() => {}))
    renderAtUid()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders profile data when loaded', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText('Jane Chef')).toBeInTheDocument()
    })
    expect(screen.getByText('I love cooking Italian food!')).toBeInTheDocument()
    expect(screen.getByText('1 public recipe')).toBeInTheDocument()
  })

  it('shows public recipe count as plural when more than one', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      publicRecipeCount: 3,
    })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText('3 public recipes')).toBeInTheDocument()
    })
  })

  it('renders the public recipes grid', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
    })
  })

  it('shows empty state when there are no public recipes', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      publicRecipes: [],
      publicRecipeCount: 0,
    })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText('No public recipes yet.')).toBeInTheDocument()
    })
  })

  it('shows 404 state for unknown uid', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockRejectedValue({
      response: { status: 404 },
    })
    renderAtUid('unknown-uid')

    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument()
    })
    expect(screen.getByText('User not found')).toBeInTheDocument()
    expect(
      screen.getByText("The profile you're looking for doesn't exist or has been removed.")
    ).toBeInTheDocument()
  })

  it('shows error state for non-404 errors', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockRejectedValue(new Error('Server error'))
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText('Error loading profile')).toBeInTheDocument()
    })
    expect(screen.getByText('Server error')).toBeInTheDocument()
  })

  it('renders Follow button', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })
  })

  it('Follow button is a no-op (does not throw)', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })

    // Should not throw
    await user.click(screen.getByRole('button', { name: 'Follow' }))
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
  })

  it('renders avatar initial when no avatarUrl', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText('Jane Chef')).toBeInTheDocument()
    })
    // Avatar letter should be "J" for "Jane Chef"
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders an <img> avatar when avatarUrl is provided', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      avatarUrl: 'https://example.com/avatar.jpg',
    })
    renderAtUid()

    await waitFor(() => {
      const img = document.querySelector('img[alt="Jane Chef"]')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })
  })

  it('calls getUserProfile with the correct uid', async () => {
    const spy = vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid('uid-123')

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('uid-123')
    })
  })
})

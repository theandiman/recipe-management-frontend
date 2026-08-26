import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { UserProfilePage } from './UserProfilePage'
import * as userApi from '../../services/userApi'
import type { UserProfile } from '../../services/userApi'
import type { Recipe } from '../../types/nutrition'
import { FollowProvider } from './FollowContext'

vi.mock('../../services/userApi', () => ({
  getUserProfile: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
}))

const mockUseAuth = vi.fn()
vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
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
      <FollowProvider>
        <Routes>
          <Route path="/user/:uid" element={<UserProfilePage />} />
          <Route path="/dashboard/recipes/:id" element={<div>Recipe detail</div>} />
          <Route path="/login" element={<div>Sign in page</div>} />
        </Routes>
      </FollowProvider>
    </MemoryRouter>
  )

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { uid: 'current-user', email: 'current@example.com' },
      isAuthenticated: true,
    })
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

  it('renders Follow button on another user\'s profile', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })
  })

  it('renders Edit profile button when viewing own profile', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'uid-123', email: 'jane@example.com' },
      isAuthenticated: true,
    })
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid('uid-123')

    await waitFor(() => {
      expect(screen.getByText('Jane Chef')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Edit profile' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^follow$/i })).not.toBeInTheDocument()
  })

  it('shows "Following" when isFollowedByCurrentUser is true', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      isFollowedByCurrentUser: true,
    })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
    })
  })

  it('shows "Follow" when isFollowedByCurrentUser is false', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      isFollowedByCurrentUser: false,
    })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })
  })

  it('calls followUser and toggles to "Following" when authenticated user clicks Follow', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    vi.spyOn(userApi, 'followUser').mockResolvedValue(undefined)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Follow' }))

    expect(userApi.followUser).toHaveBeenCalledWith('uid-123')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
    })
  })

  it('calls unfollowUser and toggles to "Follow" when authenticated user clicks Following', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      isFollowedByCurrentUser: true,
    })
    vi.spyOn(userApi, 'unfollowUser').mockResolvedValue(undefined)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Following' }))

    expect(userApi.unfollowUser).toHaveBeenCalledWith('uid-123')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })
  })

  it('navigates to /login when unauthenticated user clicks Follow', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false })
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Follow' }))

    await waitFor(() => {
      expect(screen.getByText('Sign in page')).toBeInTheDocument()
    })
  })

  it('reverts follow state when followUser API call fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)

    let rejectFollow!: (reason: Error) => void
    vi.spyOn(userApi, 'followUser').mockImplementation(
      () => new Promise<void>((_, reject) => { rejectFollow = reject })
    )
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })

    // Click without awaiting – handler suspends at followUser, optimistic update fires first
    const clickPromise = user.click(screen.getByRole('button', { name: 'Follow' }))

    // Optimistic update: button should switch to "Following" before API settles
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
    })

    // Reject the in-flight API call and let the handler finish
    rejectFollow(new Error('Network error'))
    await clickPromise

    // State should revert back to "Follow"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })
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

  it('renders follower and following counts when provided', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      followerCount: 42,
      followingCount: 17,
    })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /42.*follower/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /17.*following/i })).toBeInTheDocument()
  })

  it('does not render follower/following counts when not provided', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue(mockProfile)
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText('Jane Chef')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /followers/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\d+\s*following/i })).not.toBeInTheDocument()
  })

  it('opens followers modal when followers count is clicked', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      followerCount: 42,
      followingCount: 17,
    })
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue({ users: [], hasMore: false })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /42.*follower/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Followers' })).toBeInTheDocument()
    })
  })

  it('opens following modal when following count is clicked', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      followerCount: 42,
      followingCount: 17,
    })
    vi.spyOn(userApi, 'getFollowing').mockResolvedValue({ users: [], hasMore: false })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText(/17/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /17.*following/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Following' })).toBeInTheDocument()
    })
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      followerCount: 5,
      followingCount: 3,
    })
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue({ users: [], hasMore: false })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText(/5/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /5.*follower/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Followers' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('renders private account banner and hides recipe grid for private non-followed profile', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      ...mockProfile,
      visibility: 'PRIVATE',
      isFollowedByCurrentUser: false,
    })
    renderAtUid()

    await waitFor(() => {
      expect(screen.getByText('This Account is Private')).toBeInTheDocument()
    })
    expect(screen.getByText('Follow this user to see their public recipes and details.')).toBeInTheDocument()
    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument()
  })
})

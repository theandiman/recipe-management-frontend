import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { FollowButton } from './FollowButton'
import { FollowProvider, useFollowContext } from './FollowContext'
import * as userApi from '../../services/userApi'

vi.mock('../../services/userApi', () => ({
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}))

const mockUseAuth = vi.fn()
vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Wrapper component that seeds FollowContext state before rendering the button
interface SeedProps {
  uid: string
  isFollowed: boolean
  followerCount: number
}
const SeedAndRender: React.FC<SeedProps> = ({ uid, isFollowed, followerCount }) => {
  const { initUser } = useFollowContext()
  React.useEffect(() => {
    initUser(uid, isFollowed, followerCount)
  }, [uid, isFollowed, followerCount, initUser])
  return <FollowButton uid={uid} />
}

// Helper: renders FollowButton inside all required providers after seeding state
interface RenderOptions {
  uid?: string
  isFollowed?: boolean
  followerCount?: number
  isAuthenticated?: boolean
}

const renderButton = ({
  uid = 'user-1',
  isFollowed = false,
  followerCount = 10,
  isAuthenticated = true,
}: RenderOptions = {}) => {
  mockUseAuth.mockReturnValue({
    user: { uid: 'current-user' },
    isAuthenticated,
  })

  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <FollowProvider>
        <SeedAndRender uid={uid} isFollowed={isFollowed} followerCount={followerCount} />
      </FollowProvider>
      <Routes>
        <Route path="/login" element={<div>Sign in page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FollowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when uid has no state in context', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'current-user' }, isAuthenticated: true })
    const { container } = render(
      <MemoryRouter>
        <FollowProvider>
          <FollowButton uid="no-state-user" />
        </FollowProvider>
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows "Follow" when not following', async () => {
    renderButton({ isFollowed: false })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    })
  })

  it('shows "Following" when already following', async () => {
    renderButton({ isFollowed: true })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
    })
  })

  it('button has aria-pressed="false" when not following', async () => {
    renderButton({ isFollowed: false })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Follow' })).toHaveAttribute('aria-pressed', 'false')
    })
  })

  it('button has aria-pressed="true" when following', async () => {
    renderButton({ isFollowed: true })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Following' })).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('calls toggleFollow (optimistic) when authenticated user clicks Follow', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'followUser').mockResolvedValue(undefined)

    renderButton({ isFollowed: false })

    await waitFor(() => screen.getByRole('button', { name: 'Follow' }))
    await user.click(screen.getByRole('button', { name: 'Follow' }))

    await waitFor(() => {
      expect(userApi.followUser).toHaveBeenCalledWith('user-1')
    })
  })

  it('calls toggleFollow when authenticated user clicks Following (unfollow)', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'unfollowUser').mockResolvedValue(undefined)

    renderButton({ isFollowed: true })

    await waitFor(() => screen.getByRole('button', { name: 'Following' }))
    await user.click(screen.getByRole('button', { name: 'Following' }))

    await waitFor(() => {
      expect(userApi.unfollowUser).toHaveBeenCalledWith('user-1')
    })
  })

  it('navigates to /login when unauthenticated user clicks Follow', async () => {
    const user = userEvent.setup()

    renderButton({ isFollowed: false, isAuthenticated: false })

    await waitFor(() => screen.getByRole('button', { name: 'Follow' }))
    await user.click(screen.getByRole('button', { name: 'Follow' }))

    await waitFor(() => {
      expect(screen.getByText('Sign in page')).toBeInTheDocument()
    })
  })
})

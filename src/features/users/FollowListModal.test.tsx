import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FollowListModal } from './FollowListModal'
import * as userApi from '../../services/userApi'
import type { FollowListPage } from '../../services/userApi'

vi.mock('../../services/userApi', () => ({
  getUserProfile: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
}))

const mockPage1: FollowListPage = {
  users: [
    { uid: 'u1', displayName: 'Alice' },
    { uid: 'u2', displayName: 'Bob', avatarUrl: 'https://example.com/bob.jpg' },
  ],
  hasMore: false,
}

const mockPage1WithMore: FollowListPage = {
  users: [{ uid: 'u1', displayName: 'Alice' }],
  hasMore: true,
}

const mockPage2: FollowListPage = {
  users: [{ uid: 'u2', displayName: 'Bob' }],
  hasMore: false,
}

const renderModal = (type: 'followers' | 'following' = 'followers', onClose = vi.fn()) =>
  render(
    <MemoryRouter>
      <FollowListModal uid="uid-123" type={type} onClose={onClose} />
    </MemoryRouter>
  )

describe('FollowListModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching', () => {
    vi.spyOn(userApi, 'getFollowers').mockImplementation(() => new Promise(() => {}))
    renderModal('followers')
    expect(screen.getByTestId('follow-list-loading')).toBeInTheDocument()
  })

  it('renders followers list with display names', async () => {
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers')

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders following list with display names', async () => {
    vi.spyOn(userApi, 'getFollowing').mockResolvedValue(mockPage1)
    renderModal('following')

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows avatar image when avatarUrl is provided', async () => {
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers')

    await waitFor(() => {
      const img = document.querySelector('img[alt="Bob"]')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/bob.jpg')
    })
  })

  it('shows avatar letter initial when no avatarUrl', async () => {
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers')

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  it('shows empty state for followers', async () => {
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue({ users: [], hasMore: false })
    renderModal('followers')

    await waitFor(() => {
      expect(screen.getByText('No followers yet.')).toBeInTheDocument()
    })
  })

  it('shows empty state for following', async () => {
    vi.spyOn(userApi, 'getFollowing').mockResolvedValue({ users: [], hasMore: false })
    renderModal('following')

    await waitFor(() => {
      expect(screen.getByText('Not following anyone yet.')).toBeInTheDocument()
    })
  })

  it('shows "Followers" title for followers type', async () => {
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers')

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Followers' })).toBeInTheDocument()
    })
  })

  it('shows "Following" title for following type', async () => {
    vi.spyOn(userApi, 'getFollowing').mockResolvedValue(mockPage1)
    renderModal('following')

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Following' })).toBeInTheDocument()
    })
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers', onClose)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers', onClose)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('follow-list-modal-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows Load More button when hasMore is true', async () => {
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1WithMore)
    renderModal('followers')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
    })
  })

  it('does not show Load More button when hasMore is false', async () => {
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers')

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('loads next page when Load More is clicked', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'getFollowers')
      .mockResolvedValueOnce(mockPage1WithMore)
      .mockResolvedValueOnce(mockPage2)
    renderModal('followers')

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Load more' }))

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('each user item links to the user profile page', async () => {
    vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers')

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const aliceLink = screen.getByText('Alice').closest('a')
    expect(aliceLink).toHaveAttribute('href', '/user/u1')
  })

  it('calls getFollowers with correct uid and page 1', async () => {
    const spy = vi.spyOn(userApi, 'getFollowers').mockResolvedValue(mockPage1)
    renderModal('followers')

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('uid-123', 1)
    })
  })

  it('calls getFollowing with correct uid and page 1', async () => {
    const spy = vi.spyOn(userApi, 'getFollowing').mockResolvedValue(mockPage1)
    renderModal('following')

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('uid-123', 1)
    })
  })
})

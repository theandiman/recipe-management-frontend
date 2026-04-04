import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { FollowProvider, useFollowContext } from './FollowContext'
import * as userApi from '../../services/userApi'
import { toast } from 'sonner'

vi.mock('../../services/userApi', () => ({
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}))

const mockUseAuth = vi.fn()
vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// ─── Test consumer ─────────────────────────────────────────────────────────────
interface ConsumerProps {
  uid: string
}

const TestConsumer: React.FC<ConsumerProps> = ({ uid }) => {
  const { getFollowState, initUser, toggleFollow } = useFollowContext()
  const state = getFollowState(uid)
  return (
    <div>
      <button data-testid="init" onClick={() => initUser(uid, false, 10)}>
        Init
      </button>
      <button data-testid="init-followed" onClick={() => initUser(uid, true, 5)}>
        Init followed
      </button>
      <button data-testid="toggle" onClick={() => toggleFollow(uid)}>
        Toggle
      </button>
      {state === undefined ? (
        <span data-testid="state">uninitialized</span>
      ) : (
        <>
          <span data-testid="is-followed">{String(state.isFollowed)}</span>
          <span data-testid="follower-count">{String(state.followerCount)}</span>
        </>
      )}
    </div>
  )
}

const renderConsumer = (uid = 'user-1') =>
  render(
    <FollowProvider>
      <TestConsumer uid={uid} />
    </FollowProvider>,
  )

// ─── Tests ──────────────────────────────────────────────────────────────────────
describe('FollowContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
  })

  it('throws when useFollowContext is called outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer uid="x" />)).toThrow(
      'useFollowContext must be used within a FollowProvider',
    )
    consoleError.mockRestore()
  })

  it('returns undefined for an uninitialized uid', () => {
    renderConsumer('unknown')
    expect(screen.getByTestId('state')).toHaveTextContent('uninitialized')
  })

  it('initUser seeds isFollowed and followerCount', async () => {
    const user = userEvent.setup()
    renderConsumer()

    await user.click(screen.getByTestId('init'))

    expect(screen.getByTestId('is-followed')).toHaveTextContent('false')
    expect(screen.getByTestId('follower-count')).toHaveTextContent('10')
  })

  it('initUser updates existing state when values differ and no update is pending', async () => {
    const user = userEvent.setup()
    renderConsumer()

    // Seed initial state: not followed, 10 followers
    await user.click(screen.getByTestId('init'))
    expect(screen.getByTestId('is-followed')).toHaveTextContent('false')
    expect(screen.getByTestId('follower-count')).toHaveTextContent('10')

    // Second initUser call with different values (e.g. server re-fetch) should update
    await user.click(screen.getByTestId('init-followed'))

    expect(screen.getByTestId('is-followed')).toHaveTextContent('true')
    expect(screen.getByTestId('follower-count')).toHaveTextContent('5')
  })

  it('initUser is a no-op when called with the same values', async () => {
    const user = userEvent.setup()
    renderConsumer()

    await user.click(screen.getByTestId('init'))
    expect(screen.getByTestId('is-followed')).toHaveTextContent('false')
    expect(screen.getByTestId('follower-count')).toHaveTextContent('10')

    // Same values – should not trigger a re-render or change state
    await user.click(screen.getByTestId('init'))

    expect(screen.getByTestId('is-followed')).toHaveTextContent('false')
    expect(screen.getByTestId('follower-count')).toHaveTextContent('10')
  })

  it('toggleFollow performs optimistic update: flips isFollowed and increments followerCount', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'followUser').mockResolvedValue(undefined)

    renderConsumer()
    await user.click(screen.getByTestId('init')) // isFollowed=false, count=10

    // Click without awaiting – we want to observe the state mid-flight
    const togglePromise = user.click(screen.getByTestId('toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('is-followed')).toHaveTextContent('true')
      expect(screen.getByTestId('follower-count')).toHaveTextContent('11')
    })

    await togglePromise
    expect(userApi.followUser).toHaveBeenCalledWith('user-1')
  })

  it('toggleFollow decrements followerCount when unfollowing', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'unfollowUser').mockResolvedValue(undefined)

    renderConsumer()
    await user.click(screen.getByTestId('init-followed')) // isFollowed=true, count=5

    await user.click(screen.getByTestId('toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('is-followed')).toHaveTextContent('false')
      expect(screen.getByTestId('follower-count')).toHaveTextContent('4')
    })

    expect(userApi.unfollowUser).toHaveBeenCalledWith('user-1')
  })

  it('toggleFollow calls followUser API on follow', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(userApi, 'followUser').mockResolvedValue(undefined)

    renderConsumer()
    await user.click(screen.getByTestId('init'))
    await user.click(screen.getByTestId('toggle'))

    await waitFor(() => expect(spy).toHaveBeenCalledWith('user-1'))
  })

  it('toggleFollow calls unfollowUser API on unfollow', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(userApi, 'unfollowUser').mockResolvedValue(undefined)

    renderConsumer()
    await user.click(screen.getByTestId('init-followed'))
    await user.click(screen.getByTestId('toggle'))

    await waitFor(() => expect(spy).toHaveBeenCalledWith('user-1'))
  })

  it('toggleFollow rolls back optimistic update and shows toast on followUser error', async () => {
    const user = userEvent.setup()

    let rejectFollow!: (err: Error) => void
    vi.spyOn(userApi, 'followUser').mockImplementation(
      () => new Promise<void>((_, reject) => { rejectFollow = reject }),
    )

    renderConsumer()
    await user.click(screen.getByTestId('init')) // isFollowed=false, count=10

    const togglePromise = user.click(screen.getByTestId('toggle'))

    // Optimistic update fires immediately
    await waitFor(() => {
      expect(screen.getByTestId('is-followed')).toHaveTextContent('true')
      expect(screen.getByTestId('follower-count')).toHaveTextContent('11')
    })

    // Reject the API call
    rejectFollow(new Error('Network error'))
    await togglePromise

    // State should roll back
    await waitFor(() => {
      expect(screen.getByTestId('is-followed')).toHaveTextContent('false')
      expect(screen.getByTestId('follower-count')).toHaveTextContent('10')
    })

    // Toast should be shown
    expect(toast.error).toHaveBeenCalledWith('Failed to update follow status. Please try again.')
  })

  it('toggleFollow rolls back and shows toast on unfollowUser error', async () => {
    const user = userEvent.setup()

    let rejectUnfollow!: (err: Error) => void
    vi.spyOn(userApi, 'unfollowUser').mockImplementation(
      () => new Promise<void>((_, reject) => { rejectUnfollow = reject }),
    )

    renderConsumer()
    await user.click(screen.getByTestId('init-followed')) // isFollowed=true, count=5

    const togglePromise = user.click(screen.getByTestId('toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('is-followed')).toHaveTextContent('false')
    })

    rejectUnfollow(new Error('Network error'))
    await togglePromise

    await waitFor(() => {
      expect(screen.getByTestId('is-followed')).toHaveTextContent('true')
      expect(screen.getByTestId('follower-count')).toHaveTextContent('5')
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to update follow status. Please try again.')
  })

  it('toggleFollow does nothing when not authenticated', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    const spy = vi.spyOn(userApi, 'followUser')

    renderConsumer()
    await user.click(screen.getByTestId('init'))

    await user.click(screen.getByTestId('toggle'))

    // State must stay unchanged because we're not authenticated
    expect(spy).not.toHaveBeenCalled()
    expect(screen.getByTestId('is-followed')).toHaveTextContent('false')
  })

  it('toggleFollow ignores duplicate in-flight calls for the same uid', async () => {
    const user = userEvent.setup()
    const resolveQueue: Array<() => void> = []
    vi.spyOn(userApi, 'followUser').mockImplementation(
      () => new Promise<void>((res) => { resolveQueue.push(res) }),
    )

    renderConsumer()
    await user.click(screen.getByTestId('init'))

    // Start first toggle and wait for followUser to be called
    user.click(screen.getByTestId('toggle'))
    await waitFor(() => expect(userApi.followUser).toHaveBeenCalledTimes(1))

    // Start second toggle while first is still in-flight (pending set blocks it)
    user.click(screen.getByTestId('toggle'))
    // Give the second click a chance to process
    await new Promise((r) => setTimeout(r, 50))

    // followUser should still only be called once
    expect(userApi.followUser).toHaveBeenCalledTimes(1)

    // Resolve the first in-flight call
    resolveQueue[0]?.()
  })

  it('two consumers for the same uid share state updates', async () => {
    const user = userEvent.setup()
    vi.spyOn(userApi, 'followUser').mockResolvedValue(undefined)

    const uid = 'shared-user'

    render(
      <FollowProvider>
        <TestConsumer uid={uid} />
        <div>
          {/* Duplicate consumer – simulates two FollowButtons on the same page */}
          <TestConsumer uid={uid} />
        </div>
      </FollowProvider>,
    )

    // Use getAllByTestId since there are two consumers
    const [initBtn] = screen.getAllByTestId('init')
    await user.click(initBtn)

    // Both consumers should show the same initial state
    expect(screen.getAllByTestId('is-followed')[0]).toHaveTextContent('false')
    expect(screen.getAllByTestId('is-followed')[1]).toHaveTextContent('false')

    // Toggle from the first consumer
    const [toggleBtn] = screen.getAllByTestId('toggle')
    await user.click(toggleBtn)

    // Both consumers must update together
    await waitFor(() => {
      expect(screen.getAllByTestId('is-followed')[0]).toHaveTextContent('true')
      expect(screen.getAllByTestId('is-followed')[1]).toHaveTextContent('true')
    })
  })

  it('clears follow map when user actively logs out (true → false transition)', async () => {
    const user = userEvent.setup()

    // Start authenticated so state gets initialized
    mockUseAuth.mockReturnValue({ isAuthenticated: true })

    const { rerender } = renderConsumer()
    await user.click(screen.getByTestId('init'))
    expect(screen.getByTestId('is-followed')).toHaveTextContent('false')

    // Simulate logout (true → false transition)
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    rerender(
      <FollowProvider>
        <TestConsumer uid="user-1" />
      </FollowProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent('uninitialized')
    })
  })
})

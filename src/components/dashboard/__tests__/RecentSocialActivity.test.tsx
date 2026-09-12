import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { RecentSocialActivity } from '../RecentSocialActivity'
import { NotificationProvider } from '../../../features/notifications/NotificationContext'
import * as notificationApi from '../../../services/notificationApi'
import type { SocialNotification } from '../../../services/notificationApi'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../services/notificationApi', () => ({
  getNotifications: vi.fn(),
  markNotificationsAsRead: vi.fn(),
}))

const renderComponent = () =>
  render(
    <BrowserRouter>
      <NotificationProvider>
        <RecentSocialActivity />
      </NotificationProvider>
    </BrowserRouter>
  )

describe('RecentSocialActivity', () => {
  const mockNotifications: SocialNotification[] = [
    {
      id: 'notif-1',
      recipientUid: 'me',
      actorUid: 'actor-1',
      actorName: 'Chef Remy',
      actorAvatarUrl: 'https://example.com/remy.jpg',
      eventType: 'RECIPE_LIKE',
      targetRecipeId: 'recipe-101',
      targetRecipeName: 'Ratatouille',
      isRead: false,
      createdAt: '2024-03-01T12:00:00Z',
    },
    {
      id: 'notif-2',
      recipientUid: 'me',
      actorUid: 'actor-2',
      actorName: 'Chef Gusteau',
      eventType: 'NEW_FOLLOWER',
      isRead: true,
      createdAt: '2024-03-01T11:00:00Z',
    },
    {
      id: 'notif-3',
      recipientUid: 'me',
      actorUid: 'actor-3',
      actorName: 'Colette',
      eventType: 'RECIPE_COMMENT',
      targetRecipeId: 'recipe-102',
      targetRecipeName: 'Roast Chicken',
      contentSnippet: 'Amazing flavor balance!',
      isRead: true,
      createdAt: '2024-03-01T10:00:00Z',
    },
    {
      id: 'notif-4',
      recipientUid: 'me',
      actorUid: 'actor-4',
      actorName: 'Linguini',
      eventType: 'RECIPE_RATING',
      targetRecipeId: 'recipe-103',
      targetRecipeName: 'Soup',
      isRead: true,
      createdAt: '2024-03-01T09:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton while fetching notifications', () => {
    vi.mocked(notificationApi.getNotifications).mockImplementation(() => new Promise(() => {}))

    renderComponent()

    expect(screen.getByTestId('activity-loading-skeleton')).toBeInTheDocument()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })

  it('renders all event types (likes, follows, comments, ratings)', async () => {
    vi.mocked(notificationApi.getNotifications).mockResolvedValue({
      unreadCount: 1,
      notifications: mockNotifications,
      hasMore: false,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Chef Remy')).toBeInTheDocument()
      expect(screen.getByText(/liked your recipe/i)).toBeInTheDocument()
      expect(screen.getByText('"Ratatouille"')).toBeInTheDocument()

      expect(screen.getByText('Chef Gusteau')).toBeInTheDocument()
      expect(screen.getByText(/started following you/i)).toBeInTheDocument()

      expect(screen.getByText('Colette')).toBeInTheDocument()
      expect(screen.getByText(/commented on/i)).toBeInTheDocument()
      expect(screen.getByText('"Amazing flavor balance!"')).toBeInTheDocument()

      expect(screen.getByText('Linguini')).toBeInTheDocument()
      expect(screen.getByText(/reviewed/i)).toBeInTheDocument()
    })
  })

  it('marks unread notification as read on click and navigates to target recipe', async () => {
    vi.mocked(notificationApi.getNotifications).mockResolvedValue({
      unreadCount: 1,
      notifications: mockNotifications,
      hasMore: false,
    })
    vi.mocked(notificationApi.markNotificationsAsRead).mockResolvedValue()

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Chef Remy')).toBeInTheDocument()
    })

    const remyItem = screen.getByText('Chef Remy').closest('button')!
    fireEvent.click(remyItem)

    await waitFor(() => {
      expect(notificationApi.markNotificationsAsRead).toHaveBeenCalledWith(['notif-1'])
      expect(mockNavigate).toHaveBeenCalledWith('/recipes/recipe-101')
    })
  })

  it('navigates to user profile for NEW_FOLLOWER events without target recipe', async () => {
    vi.mocked(notificationApi.getNotifications).mockResolvedValue({
      unreadCount: 0,
      notifications: [mockNotifications[1]], // Chef Gusteau follower
      hasMore: false,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Chef Gusteau')).toBeInTheDocument()
    })

    const gusteauItem = screen.getByText('Chef Gusteau').closest('button')!
    fireEvent.click(gusteauItem)

    expect(mockNavigate).toHaveBeenCalledWith('/user/actor-2')
  })

  it('renders compact empty state when there is no activity', async () => {
    vi.mocked(notificationApi.getNotifications).mockResolvedValue({
      unreadCount: 0,
      notifications: [],
      hasMore: false,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/No recent activity yet/i)).toBeInTheDocument()
    })
  })

  it('handles error gracefully and retries', async () => {
    vi.mocked(notificationApi.getNotifications)
      .mockRejectedValueOnce(new Error('Server unavailable'))
      .mockResolvedValueOnce({
        unreadCount: 0,
        notifications: mockNotifications,
        hasMore: false,
      })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Couldn't load recent activity/i)).toBeInTheDocument()
    })

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByText('Chef Remy')).toBeInTheDocument()
    })
  })
})

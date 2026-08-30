import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NotificationBell } from '../NotificationBell'
import * as notificationApi from '../../../services/notificationApi'

vi.mock('../../../services/notificationApi', () => ({
  getNotifications: vi.fn(),
  markNotificationsAsRead: vi.fn(),
}))

const mockNotifications = {
  unreadCount: 2,
  hasMore: false,
  notifications: [
    {
      id: 'n1',
      recipientUid: 'u1',
      actorUid: 'u2',
      actorName: 'Chef Jane',
      eventType: 'RECIPE_LIKE' as const,
      targetRecipeId: 'r1',
      targetRecipeName: 'Carbonara',
      isRead: false,
      createdAt: '2026-08-30T08:00:00Z',
    },
    {
      id: 'n2',
      recipientUid: 'u1',
      actorUid: 'u3',
      actorName: 'Gordon R',
      eventType: 'NEW_FOLLOWER' as const,
      isRead: false,
      createdAt: '2026-08-30T08:10:00Z',
    },
  ],
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders bell button and fetches unread count', async () => {
    vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue(mockNotifications)

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    )

    expect(screen.getByLabelText('Activity Notifications')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('opens notification dropdown on click', async () => {
    vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue(mockNotifications)

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    )

    const bellBtn = screen.getByLabelText('Activity Notifications')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      expect(screen.getByText('Activity Notifications')).toBeInTheDocument()
      expect(screen.getByText('Chef Jane')).toBeInTheDocument()
    })
  })

  it('calls markNotificationsAsRead on mark all read button click', async () => {
    vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue(mockNotifications)
    vi.spyOn(notificationApi, 'markNotificationsAsRead').mockResolvedValue()

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    )

    const bellBtn = screen.getByLabelText('Activity Notifications')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      expect(screen.getByText('Mark all as read')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Mark all as read'))

    await waitFor(() => {
      expect(notificationApi.markNotificationsAsRead).toHaveBeenCalledWith()
    })
  })
})

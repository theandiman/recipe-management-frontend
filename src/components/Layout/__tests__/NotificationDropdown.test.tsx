import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NotificationDropdown } from '../NotificationDropdown'
import type { SocialNotification } from '../../../services/notificationApi'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockNotifications: SocialNotification[] = [
  {
    id: 'n1',
    recipientUid: 'u1',
    actorUid: 'u2',
    actorName: 'Chef Jane',
    eventType: 'RECIPE_LIKE',
    targetRecipeId: 'r1',
    targetRecipeName: 'Spaghetti Carbonara',
    isRead: false,
    createdAt: '2026-08-30T08:00:00Z',
  },
  {
    id: 'n2',
    recipientUid: 'u1',
    actorUid: 'u3',
    actorName: 'Gordon R',
    eventType: 'NEW_FOLLOWER',
    isRead: true,
    createdAt: '2026-08-30T08:10:00Z',
  },
]

describe('NotificationDropdown', () => {
  it('renders notification items correctly', () => {
    render(
      <MemoryRouter>
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
          onMarkAllRead={vi.fn()}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('Chef Jane')).toBeInTheDocument()
    expect(screen.getByText(/liked your recipe/i)).toBeInTheDocument()
    expect(screen.getByText(/Spaghetti Carbonara/i)).toBeInTheDocument()
    expect(screen.getByText('Gordon R')).toBeInTheDocument()
    expect(screen.getByText(/started following you/i)).toBeInTheDocument()
  })

  it('navigates to target recipe when notification item with recipe id is clicked', () => {
    const onClose = vi.fn()
    const onMarkItemRead = vi.fn()

    render(
      <MemoryRouter>
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
          onMarkAllRead={vi.fn()}
          onMarkItemRead={onMarkItemRead}
          onClose={onClose}
        />
      </MemoryRouter>
    )

    const recipeNotification = screen.getByText('Chef Jane').closest('div[class*="cursor-pointer"]')
    fireEvent.click(recipeNotification!)

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onMarkItemRead).toHaveBeenCalledWith('n1')
    expect(mockNavigate).toHaveBeenCalledWith('/recipes/r1')
  })

  it('navigates to user profile when notification item without recipe id is clicked', () => {
    const onClose = vi.fn()

    render(
      <MemoryRouter>
        <NotificationDropdown
          notifications={mockNotifications}
          unreadCount={1}
          onMarkAllRead={vi.fn()}
          onClose={onClose}
        />
      </MemoryRouter>
    )

    const followerNotification = screen.getByText('Gordon R').closest('div[class*="cursor-pointer"]')
    fireEvent.click(followerNotification!)

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/user/u3')
  })

  it('renders empty state when there are no notifications', () => {
    render(
      <MemoryRouter>
        <NotificationDropdown
          notifications={[]}
          unreadCount={0}
          onMarkAllRead={vi.fn()}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('No notifications yet. Activity will appear here!')).toBeInTheDocument()
  })
})

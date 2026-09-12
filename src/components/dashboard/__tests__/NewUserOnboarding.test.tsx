import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { NewUserOnboarding } from '../NewUserOnboarding'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('NewUserOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all three onboarding onramps', () => {
    render(
      <BrowserRouter>
        <NewUserOnboarding />
      </BrowserRouter>
    )

    expect(screen.getByText('Get started with CookFlow')).toBeInTheDocument()
    expect(screen.getByText('Discover the Community')).toBeInTheDocument()
    expect(screen.getByText('Create Your First Recipe')).toBeInTheDocument()
    expect(screen.getByText('Generate with AI')).toBeInTheDocument()
  })

  it('navigates to Community, Create, and Generate routes from action buttons', () => {
    render(
      <BrowserRouter>
        <NewUserOnboarding />
      </BrowserRouter>
    )

    const communityBtn = screen.getByRole('button', { name: /Explore Community/i })
    fireEvent.click(communityBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/community')

    const createBtn = screen.getByRole('button', { name: /Create Recipe/i })
    fireEvent.click(createBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/create')

    const aiBtn = screen.getByRole('button', { name: /Try AI Generator/i })
    fireEvent.click(aiBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/generate')
  })
})

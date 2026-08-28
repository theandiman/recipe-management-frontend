import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { HelpPage } from './HelpPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderHelpPage = () =>
  render(
    <BrowserRouter>
      <HelpPage />
    </BrowserRouter>
  )

describe('HelpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the page heading and search bar', () => {
    renderHelpPage()
    expect(screen.getByText('Help & Documentation Center')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search help topics/i)).toBeInTheDocument()
  })

  it('should render updated section titles', () => {
    renderHelpPage()
    expect(screen.getByText('Getting Started & Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Command Palette & Quick Search (⌘K)')).toBeInTheDocument()
    expect(screen.getByText('✨ Direct AI Semantic Search & Ranking')).toBeInTheDocument()
    expect(screen.getByText('🍳 Cooking Mode & Hands-Free Voice Controls')).toBeInTheDocument()
    expect(screen.getByText('🥗 Nutrition Facts & AI Nutrition Estimation')).toBeInTheDocument()
  })

  it('should filter help topics when searching in the input bar', () => {
    renderHelpPage()
    const searchInput = screen.getByPlaceholderText(/Search help topics/i)

    fireEvent.change(searchInput, { target: { value: 'voice' } })

    expect(screen.getByText('🍳 Cooking Mode & Hands-Free Voice Controls')).toBeInTheDocument()
    expect(screen.queryByText('Command Palette & Quick Search (⌘K)')).not.toBeInTheDocument()
  })

  it('should filter help topics when clicking category pills', () => {
    renderHelpPage()
    const aiCategoryBtn = screen.getByRole('button', { name: /✨ AI Features/i })

    fireEvent.click(aiCategoryBtn)

    expect(screen.getByText('✨ Direct AI Semantic Search & Ranking')).toBeInTheDocument()
    expect(screen.queryByText('Getting Started & Dashboard')).not.toBeInTheDocument()
  })

  it('should toggle a section open when its header is clicked', () => {
    renderHelpPage()

    // Click "Browsing Your Recipe Library" which starts closed
    const button = screen.getByRole('button', { name: /Browsing Your Recipe Library/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('should navigate when footer CTA buttons are clicked', () => {
    renderHelpPage()

    const createBtn = screen.getByRole('button', { name: /Create a Recipe/i })
    fireEvent.click(createBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/create')

    const aiGenBtn = screen.getByRole('button', { name: /✨ Try AI Generator/i })
    fireEvent.click(aiGenBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/generate')
  })
})

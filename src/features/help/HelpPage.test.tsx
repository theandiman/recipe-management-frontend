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

  it('should render the page heading', () => {
    renderHelpPage()
    expect(screen.getByText('Help & Documentation')).toBeInTheDocument()
    expect(screen.getByText(/Everything you need to know about using CookFlow/i)).toBeInTheDocument()
  })

  it('should render all section titles', () => {
    renderHelpPage()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('Browsing Your Recipe Library')).toBeInTheDocument()
    expect(screen.getByText('Creating a Recipe')).toBeInTheDocument()
    expect(screen.getByText('Editing & Deleting Recipes')).toBeInTheDocument()
    expect(screen.getByText('Using the AI Recipe Generator')).toBeInTheDocument()
    expect(screen.getByText('Cooking Mode')).toBeInTheDocument()
    expect(screen.getByText('Account & Sign Out')).toBeInTheDocument()
  })

  it('should open the Getting Started section by default', () => {
    renderHelpPage()
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument()
  })

  it('should toggle a section open when its header is clicked', () => {
    renderHelpPage()

    // Click "Creating a Recipe" which starts closed
    const button = screen.getByRole('button', { name: /Creating a Recipe/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('should close an open section when its header is clicked again', () => {
    renderHelpPage()

    // "Getting Started" starts open
    const button = screen.getByRole('button', { name: /Getting Started/i })
    expect(button).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('should allow multiple sections to be open simultaneously', () => {
    renderHelpPage()

    const createButton = screen.getByRole('button', { name: /Creating a Recipe/i })
    const libraryButton = screen.getByRole('button', { name: /Browsing Your Recipe Library/i })

    fireEvent.click(createButton)
    fireEvent.click(libraryButton)

    expect(createButton).toHaveAttribute('aria-expanded', 'true')
    expect(libraryButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('should render the footer call-to-action buttons', () => {
    renderHelpPage()
    expect(screen.getByRole('button', { name: /Create a Recipe/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Browse Recipes/i })).toBeInTheDocument()
  })

  it('should navigate to create page when "Create a Recipe" CTA is clicked', () => {
    renderHelpPage()
    const createButton = screen.getByRole('button', { name: /Create a Recipe/i })
    fireEvent.click(createButton)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/create')
  })

  it('should navigate to recipes page when "Browse Recipes" CTA is clicked', () => {
    renderHelpPage()
    const browseButton = screen.getByRole('button', { name: /Browse Recipes/i })
    fireEvent.click(browseButton)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes')
  })
})

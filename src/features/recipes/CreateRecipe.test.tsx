import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { CreateRecipe } from './CreateRecipe'

// Mock recipe storage API
vi.mock('../../services/recipeStorageApi', () => ({
  saveRecipe: vi.fn(() => Promise.resolve({
    id: 'test-recipe-id',
    title: 'Test Recipe',
    userId: 'test-user',
    ingredients: [],
    instructions: [],
    servings: 4,
    source: 'user-created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('CreateRecipe - Multi-Step Wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step Navigation', () => {
    it('should render on step 1 by default', () => {
      renderWithRouter(<CreateRecipe />)
      expect(screen.getByText(/Step 1 of 4: Basic Info/i)).toBeInTheDocument()
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
    })

    it('should show all 4 steps in progress indicator', () => {
      renderWithRouter(<CreateRecipe />)
      expect(screen.getByText('Basic Info')).toBeInTheDocument()
      expect(screen.getByText('Ingredients')).toBeInTheDocument()
      expect(screen.getByText('Instructions')).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
    })

    it('should navigate to next step when Next button is clicked', () => {
      renderWithRouter(<CreateRecipe />)
      
      const nextButton = screen.getByRole('button', { name: /Next →/i })
      fireEvent.click(nextButton)
      
      expect(screen.getByText(/Step 2 of 4: Ingredients/i)).toBeInTheDocument()
    })

    it('should navigate to previous step when Back button is clicked', () => {
      renderWithRouter(<CreateRecipe />)
      
      // Go to step 2
      const nextButton = screen.getByRole('button', { name: /Next →/i })
      fireEvent.click(nextButton)
      
      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /← Back/i })
      fireEvent.click(backButton)
      
      expect(screen.getByText(/Step 1 of 4: Basic Info/i)).toBeInTheDocument()
    })

    it('should disable Back button on step 1', () => {
      renderWithRouter(<CreateRecipe />)
      
      const backButton = screen.getByRole('button', { name: /← Back/i })
      expect(backButton).toBeDisabled()
    })

    it('should allow jumping to specific step via progress indicator', () => {
      renderWithRouter(<CreateRecipe />)
      
      // Click on step 3 in progress indicator
      const step3Button = screen.getByRole('button', { name: /Instructions/i })
      fireEvent.click(step3Button)
      
      expect(screen.getByText(/Step 3 of 4: Instructions/i)).toBeInTheDocument()
    })

    it('should show Save Recipe button only on step 4', () => {
      renderWithRouter(<CreateRecipe />)
      
      // On step 1, should show Next button
      expect(screen.getByRole('button', { name: /Next →/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Save Recipe/i })).not.toBeInTheDocument()
      
      // Navigate to step 4
      const step4Button = screen.getByRole('button', { name: /Review/i })
      fireEvent.click(step4Button)
      
      // On step 4, should show Save Recipe button
      expect(screen.queryByRole('button', { name: /Next →/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Save Recipe/i })).toBeInTheDocument()
    })
  })

  describe('Step 1: Basic Info', () => {
    it('should render all basic info fields', () => {
      renderWithRouter(<CreateRecipe />)
      
      expect(screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Brief description/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('15')).toBeInTheDocument() // Prep time
      expect(screen.getByPlaceholderText('30')).toBeInTheDocument() // Cook time
      expect(screen.getByPlaceholderText('4')).toBeInTheDocument() // Servings
    })

    it('should update title field', () => {
      renderWithRouter(<CreateRecipe />)
      
      const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
      fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
      
      expect(titleInput).toHaveValue('Test Recipe')
    })

    it('should mark required fields', () => {
      renderWithRouter(<CreateRecipe />)
      
      expect(screen.getAllByText('*')).toHaveLength(2) // Recipe name and servings
    })
  })

  describe('Step 2: Ingredients', () => {
    beforeEach(() => {
      renderWithRouter(<CreateRecipe />)
      // Navigate to step 2
      const nextButton = screen.getByRole('button', { name: /Next →/i })
      fireEvent.click(nextButton)
    })

    it('should render ingredients section', () => {
      expect(screen.getByRole('heading', { name: /Ingredients \*/i })).toBeInTheDocument()
    })

    it('should start with one empty ingredient field', () => {
      const ingredientInputs = screen.getAllByPlaceholderText(/2 cups all-purpose flour/i)
      expect(ingredientInputs).toHaveLength(1)
    })

    it('should add new ingredient field when Add button is clicked', () => {
      const addButton = screen.getByRole('button', { name: /Add Ingredient/i })
      fireEvent.click(addButton)
      
      const ingredientInputs = screen.getAllByPlaceholderText(/2 cups all-purpose flour/i)
      expect(ingredientInputs).toHaveLength(2)
    })

    it('should update ingredient value', () => {
      const ingredientInput = screen.getByPlaceholderText(/2 cups all-purpose flour/i)
      fireEvent.change(ingredientInput, { target: { value: '1 cup sugar' } })
      
      expect(ingredientInput).toHaveValue('1 cup sugar')
    })

    it('should remove ingredient when delete button is clicked', () => {
      // Add a second ingredient first
      const addButton = screen.getByRole('button', { name: /Add Ingredient/i })
      fireEvent.click(addButton)
      
      const deleteButtons = screen.getAllByRole('button', { name: '' })
      const firstDeleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg')?.querySelector('path')?.getAttribute('d')?.includes('M19 7')
      )
      
      if (firstDeleteButton) {
        fireEvent.click(firstDeleteButton)
        const ingredientInputs = screen.getAllByPlaceholderText(/2 cups all-purpose flour/i)
        expect(ingredientInputs).toHaveLength(1)
      }
    })

    it('should not allow removing last ingredient', () => {
      const deleteButtons = screen.queryAllByRole('button', { name: '' })
      // Should not have delete button when only one ingredient exists
      expect(deleteButtons.length).toBe(0)
    })
  })

  describe('Step 3: Instructions & Tags', () => {
    beforeEach(() => {
      renderWithRouter(<CreateRecipe />)
      // Navigate to step 3
      const step3Button = screen.getByRole('button', { name: /Instructions/i })
      fireEvent.click(step3Button)
    })

    it('should render instructions section', () => {
      expect(screen.getByRole('heading', { name: /Instructions \*/i })).toBeInTheDocument()
    })

    it('should start with one empty instruction field', () => {
      const instructionInputs = screen.getAllByPlaceholderText(/Describe this step in detail/i)
      expect(instructionInputs).toHaveLength(1)
    })

    it('should add new instruction field when Add Step button is clicked', () => {
      const addButton = screen.getByRole('button', { name: /Add Step/i })
      fireEvent.click(addButton)
      
      const instructionInputs = screen.getAllByPlaceholderText(/Describe this step in detail/i)
      expect(instructionInputs).toHaveLength(2)
    })

    it('should render tags section', () => {
      expect(screen.getByText('Tags (Optional)')).toBeInTheDocument()
    })

    it('should add tag when Add button is clicked', () => {
      const tagInput = screen.getByPlaceholderText(/Add tags/i)
      fireEvent.change(tagInput, { target: { value: 'quick' } })
      
      const addButton = screen.getByRole('button', { name: /^Add$/i })
      fireEvent.click(addButton)
      
      expect(screen.getByText('quick')).toBeInTheDocument()
    })

    it('should add tag when Enter key is pressed', () => {
      const tagInput = screen.getByPlaceholderText(/Add tags/i)
      fireEvent.change(tagInput, { target: { value: 'healthy' } })
      fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' })
      
      expect(screen.getByText('healthy')).toBeInTheDocument()
    })

    it('should remove tag when × button is clicked', () => {
      // Add a tag first
      const tagInput = screen.getByPlaceholderText(/Add tags/i)
      fireEvent.change(tagInput, { target: { value: 'vegetarian' } })
      
      const addButton = screen.getByRole('button', { name: /^Add$/i })
      fireEvent.click(addButton)
      
      // Find and click the × button
      const removeButton = screen.getByRole('button', { name: /×/i })
      fireEvent.click(removeButton)
      
      expect(screen.queryByText('vegetarian')).not.toBeInTheDocument()
    })
  })

  describe('Step 4: Review & Preview', () => {
    beforeEach(() => {
      renderWithRouter(<CreateRecipe />)
      // Navigate to step 4
      const step4Button = screen.getByRole('button', { name: /Review/i })
      fireEvent.click(step4Button)
    })

    it('should render review section', () => {
      expect(screen.getByText('Review Your Recipe')).toBeInTheDocument()
    })

    it('should show Edit/Preview toggle only on step 4', () => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('should toggle between Edit and Preview modes', () => {
      // Should start in Edit mode
      expect(screen.getByText('Review Your Recipe')).toBeInTheDocument()
      
      // Switch to Preview mode
      const previewButton = screen.getByRole('button', { name: /Preview/i })
      fireEvent.click(previewButton)
      
      // Preview mode should show "Untitled Recipe" for empty title
      expect(screen.getByText('Untitled Recipe')).toBeInTheDocument()
      
      // Switch back to Edit mode
      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)
      
      expect(screen.getByText('Review Your Recipe')).toBeInTheDocument()
    })

    it('should not show Edit/Preview toggle on other steps', () => {
      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /← Back/i })
      fireEvent.click(backButton)
      fireEvent.click(backButton)
      fireEvent.click(backButton)
      
      expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Preview/i })).not.toBeInTheDocument()
    })
  })

  describe('Form Actions', () => {
    it('should have Cancel button on all steps', () => {
      renderWithRouter(<CreateRecipe />)
      
      for (let i = 1; i <= 4; i++) {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
        
        if (i < 4) {
          const nextButton = screen.getByRole('button', { name: /Next →/i })
          fireEvent.click(nextButton)
        }
      }
    })

    it('should navigate back when Cancel is clicked', () => {
      renderWithRouter(<CreateRecipe />)
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes')
    })
  })

  describe('State Persistence', () => {
    it('should preserve form data when navigating between steps', () => {
      renderWithRouter(<CreateRecipe />)
      
      // Fill out step 1
      const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
      fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
      
      // Go to step 2
      const nextButton = screen.getByRole('button', { name: /Next →/i })
      fireEvent.click(nextButton)
      
      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /← Back/i })
      fireEvent.click(backButton)
      
      // Title should still be there
      expect(titleInput).toHaveValue('Test Recipe')
    })
  })

  describe('Progress Indicator Visual States', () => {
    it('should highlight current step', () => {
      renderWithRouter(<CreateRecipe />)
      
      // Step 1 should be highlighted (green background)
      const step1Button = screen.getByRole('button', { name: /Basic Info/i })
      const step1Icon = step1Button.querySelector('div')
      expect(step1Icon).toHaveClass('bg-green-600')
    })

    it('should show completed steps with checkmark', () => {
      renderWithRouter(<CreateRecipe />)
      
      // Navigate to step 2
      const nextButton = screen.getByRole('button', { name: /Next →/i })
      fireEvent.click(nextButton)
      
      // Step 1 should now show checkmark
      const step1Button = screen.getByRole('button', { name: /Basic Info/i })
      expect(step1Button.textContent).toContain('✓')
    })
  })
})

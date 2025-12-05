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
      expect(screen.getByText(/Step 1 of 5: Basic Info/i)).toBeInTheDocument()
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
    })

    it('should show all 5 steps in progress indicator', () => {
      renderWithRouter(<CreateRecipe />)
      expect(screen.getByText('Basic Info')).toBeInTheDocument()
      expect(screen.getByText('Ingredients')).toBeInTheDocument()
      expect(screen.getByText('Instructions')).toBeInTheDocument()
      expect(screen.getByText('Additional Info')).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
    })

    it('should navigate to next step when Next button is clicked', () => {
      renderWithRouter(<CreateRecipe />)
      
      const nextButton = screen.getByRole('button', { name: /Next →/i })
      fireEvent.click(nextButton)
      
      expect(screen.getByText(/Step 2 of 5: Ingredients/i)).toBeInTheDocument()
    })

    it('should navigate to previous step when Back button is clicked', () => {
      renderWithRouter(<CreateRecipe />)
      
      // Go to step 2
      const nextButton = screen.getByRole('button', { name: /Next →/i })
      fireEvent.click(nextButton)
      
      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /← Back/i })
      fireEvent.click(backButton)
      
      expect(screen.getByText(/Step 1 of 5: Basic Info/i)).toBeInTheDocument()
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
      
      expect(screen.getByText(/Step 3 of 5: Instructions/i)).toBeInTheDocument()
    })

    it('should show Save Recipe button only on step 5', () => {
      renderWithRouter(<CreateRecipe />)
      
      // On step 1, should show Next button
      expect(screen.getByRole('button', { name: /Next →/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Save Recipe/i })).not.toBeInTheDocument()
      
      // Navigate to step 5
      const step5Button = screen.getByRole('button', { name: /Review/i })
      fireEvent.click(step5Button)
      
      // On step 5, should show Save Recipe button
      expect(screen.queryByRole('button', { name: /Next →/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Save Recipe/i })).toBeInTheDocument()
    })
  })

  describe('Step 1: Basic Info', () => {
    it('should render all basic info fields', () => {
      renderWithRouter(<CreateRecipe />)
      
      expect(screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Brief description/i)).toBeInTheDocument()
    })

    it('should update title field', () => {
      renderWithRouter(<CreateRecipe />)
      
      const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
      fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
      
      expect(titleInput).toHaveValue('Test Recipe')
    })

    it('should mark required fields', () => {
      renderWithRouter(<CreateRecipe />)
      
      expect(screen.getAllByText('*')).toHaveLength(1) // Recipe name only
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
      const quantityInputs = screen.getAllByPlaceholderText('1')
      expect(quantityInputs.length).toBeGreaterThanOrEqual(1)
    })

    it('should add new ingredient field when Add button is clicked', () => {
      const addButton = screen.getByRole('button', { name: /Add Ingredient/i })
      const initialQuantityInputs = screen.getAllByPlaceholderText('1')
      const initialCount = initialQuantityInputs.length
      
      fireEvent.click(addButton)
      
      const updatedQuantityInputs = screen.getAllByPlaceholderText('1')
      expect(updatedQuantityInputs.length).toBe(initialCount + 1)
    })

    it('should update ingredient quantity value', () => {
      const quantityInputs = screen.getAllByPlaceholderText('1')
      fireEvent.change(quantityInputs[0], { target: { value: '2' } })
      
      expect(quantityInputs[0]).toHaveValue('2')
    })

    it('should update ingredient item name', () => {
      const itemInputs = screen.getAllByPlaceholderText('e.g., all-purpose flour')
      fireEvent.change(itemInputs[0], { target: { value: 'flour' } })
      
      expect(itemInputs[0]).toHaveValue('flour')
    })

    it('should remove ingredient when delete button is clicked', () => {
      // Add a second ingredient first
      const addButton = screen.getByRole('button', { name: /Add Ingredient/i })
      fireEvent.click(addButton)
      
      const deleteButtons = screen.getAllByRole('button', { name: /Remove/i })
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0])
        const updatedQuantityInputs = screen.getAllByPlaceholderText('1')
        expect(updatedQuantityInputs.length).toBe(1)
      }
    })

    it('should not allow removing last ingredient', () => {
      const deleteButtons = screen.queryAllByRole('button', { name: /Remove/i })
      // Should not have delete button when only one ingredient exists
      expect(deleteButtons.length).toBe(0)
    })
  })

  describe('Step 3: Instructions', () => {
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
  })

  describe('Step 4: Additional Info', () => {
    beforeEach(() => {
      renderWithRouter(<CreateRecipe />)
      // Navigate to step 4
      const step4Button = screen.getByRole('button', { name: /Additional Info/i })
      fireEvent.click(step4Button)
    })

    it('should render additional info section', () => {
      expect(screen.getByText('Additional Information')).toBeInTheDocument()
    })

    it('should show time and servings inputs', () => {
      expect(screen.getByPlaceholderText('15')).toBeInTheDocument() // Prep time
      expect(screen.getByPlaceholderText('30')).toBeInTheDocument() // Cook time
      expect(screen.getByPlaceholderText('4')).toBeInTheDocument() // Servings
    })

    it('should show tags section', () => {
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

  describe('Step 5: Review & Preview', () => {
    beforeEach(() => {
      renderWithRouter(<CreateRecipe />)
      // Navigate to step 5
      const step5Button = screen.getByRole('button', { name: /Review/i })
      fireEvent.click(step5Button)
    })

    it('should render preview on step 5', () => {
      // Step 5 should show preview with "Untitled Recipe" for empty title
      expect(screen.getByText('Untitled Recipe')).toBeInTheDocument()
    })

    it('should not show Edit/Preview toggle', () => {
      // Toggle should not exist anymore
      expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Preview/i })).not.toBeInTheDocument()
    })

    it('should show Save Recipe button on step 5', () => {
      expect(screen.getByRole('button', { name: /Save Recipe/i })).toBeInTheDocument()
    })

    it('should show Back button on step 5', () => {
      const backButton = screen.getByRole('button', { name: /← Back/i })
      expect(backButton).toBeInTheDocument()
      
      // Should navigate back to step 4
      fireEvent.click(backButton)
      expect(screen.getByText(/Step 4 of 5: Additional Info/i)).toBeInTheDocument()
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
      expect(step1Icon).toHaveClass('bg-emerald-600')
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

  describe('Image Upload', () => {
    it('should show file upload UI when no image is uploaded', () => {
      renderWithRouter(<CreateRecipe />)
      
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument()
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
      expect(screen.getByText('Recipe Image')).toBeInTheDocument()
    })

    it('should have file input with correct attributes', () => {
      const { container } = renderWithRouter(<CreateRecipe />)
      
      const input = container.querySelector('input[type="file"]') as HTMLInputElement
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('accept', 'image/*')
      expect(input).toHaveClass('hidden')
    })
  })

  describe('Form Validation', () => {
    describe('Recipe Name Validation', () => {
      it('should show error when trying to save without recipe name', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Navigate to step 4
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        // Try to save without recipe name
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should show error message
        expect(screen.getByText('Recipe name is required')).toBeInTheDocument()
        
        // Should navigate back to step 1
        expect(screen.getByText(/Step 1 of 5: Basic Info/i)).toBeInTheDocument()
      })

      it('should show red border on title field when validation fails', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Title field should have red border
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        expect(titleInput).toHaveClass('border-red-500')
      })

      it('should clear error when user starts typing recipe name', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Navigate to step 4 and trigger validation
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Error should be visible
        expect(screen.getByText('Recipe name is required')).toBeInTheDocument()
        
        // Start typing
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'T' } })
        
        // Error should clear
        expect(screen.queryByText('Recipe name is required')).not.toBeInTheDocument()
        expect(titleInput).not.toHaveClass('border-red-500')
      })

      it('should show error indicator on step 1 in progress indicator', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Step 1 should have red ring and exclamation mark
        const step1Button = screen.getByRole('button', { name: /Basic Info/i })
        const step1Icon = step1Button.querySelector('div')
        expect(step1Icon).toHaveClass('ring-2', 'ring-red-500')
        
        // Should have exclamation badge
        const badge = step1Icon?.querySelector('.bg-red-500')
        expect(badge).toBeInTheDocument()
        expect(badge?.textContent).toBe('!')
      })
    })

    describe('Ingredients Validation', () => {
      it('should show error when trying to save without ingredients', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        // Navigate to step 4
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        // Try to save
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should show error and navigate to step 2
        expect(screen.getByText('At least one ingredient is required')).toBeInTheDocument()
        expect(screen.getByText(/Step 2 of 5: Ingredients/i)).toBeInTheDocument()
      })

      it('should show error indicator on step 2 in progress indicator', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Step 2 should have red ring
        const step2Button = screen.getByRole('button', { name: /Ingredients/i })
        const step2Icon = step2Button.querySelector('div')
        expect(step2Icon).toHaveClass('ring-2', 'ring-red-500')
      })

      it('should clear error when user adds ingredient item', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        // Navigate to step 4 and trigger validation
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Error should be visible on step 2
        expect(screen.getByText('At least one ingredient is required')).toBeInTheDocument()
        
        // Add an ingredient
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        // Error should clear
        expect(screen.queryByText('At least one ingredient is required')).not.toBeInTheDocument()
      })

      it('should accept ingredient with only item field filled', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        // Add ingredient item only (no quantity/unit)
        const nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        // Add instruction
        const step3Button = screen.getByRole('button', { name: /Instructions/i })
        fireEvent.click(step3Button)
        
        const instructionInput = screen.getAllByPlaceholderText(/Describe this step in detail/i)[0]
        fireEvent.change(instructionInput, { target: { value: 'Mix ingredients' } })
        
        // Navigate to step 4 and save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should not show ingredients error
        expect(screen.queryByText('At least one ingredient is required')).not.toBeInTheDocument()
      })
    })

    describe('Instructions Validation', () => {
      it('should show error when trying to save without instructions', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        // Add ingredient
        const nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        // Navigate to step 4
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        // Try to save
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should show error and navigate to step 3
        expect(screen.getByText('At least one instruction is required')).toBeInTheDocument()
        expect(screen.getByText(/Step 3 of 5: Instructions/i)).toBeInTheDocument()
      })

      it('should show error indicator on step 3 in progress indicator', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name and ingredient
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        const nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Step 3 should have red ring
        const step3Button = screen.getByRole('button', { name: /Instructions/i })
        const step3Icon = step3Button.querySelector('div')
        expect(step3Icon).toHaveClass('ring-2', 'ring-red-500')
      })

      it('should clear error when user adds instruction', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name and ingredient
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        const nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        // Navigate to step 4 and trigger validation
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Error should be visible on step 3
        expect(screen.getByText('At least one instruction is required')).toBeInTheDocument()
        
        // Add instruction
        const instructionInput = screen.getAllByPlaceholderText(/Describe this step in detail/i)[0]
        fireEvent.change(instructionInput, { target: { value: 'Mix ingredients' } })
        
        // Error should clear
        expect(screen.queryByText('At least one instruction is required')).not.toBeInTheDocument()
      })
    })

    describe('Multiple Validation Errors', () => {
      it('should show all validation errors when form is completely empty', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should navigate to first error step (step 1)
        expect(screen.getByText(/Step 1 of 5: Basic Info/i)).toBeInTheDocument()
        expect(screen.getByText('Recipe name is required')).toBeInTheDocument()
        
        // All error steps should be marked in progress indicator
        const step1Button = screen.getByRole('button', { name: /Basic Info/i })
        const step2Button = screen.getByRole('button', { name: /Ingredients/i })
        const step3Button = screen.getByRole('button', { name: /Instructions/i })
        
        expect(step1Button.querySelector('.ring-red-500')).toBeInTheDocument()
        expect(step2Button.querySelector('.ring-red-500')).toBeInTheDocument()
        expect(step3Button.querySelector('.ring-red-500')).toBeInTheDocument()
      })

      it('should navigate to first error step', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name (fix step 1)
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should navigate to step 2 (first error)
        expect(screen.getByText(/Step 2 of 5: Ingredients/i)).toBeInTheDocument()
        expect(screen.getByText('At least one ingredient is required')).toBeInTheDocument()
      })

      it('should clear error indicators as user fixes issues', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Navigate to step 4 and trigger validation
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // All steps should have errors
        let step1Button = screen.getByRole('button', { name: /Basic Info/i })
        let step2Button = screen.getByRole('button', { name: /Ingredients/i })
        let step3Button = screen.getByRole('button', { name: /Instructions/i })
        
        expect(step1Button.querySelector('.ring-red-500')).toBeInTheDocument()
        expect(step2Button.querySelector('.ring-red-500')).toBeInTheDocument()
        expect(step3Button.querySelector('.ring-red-500')).toBeInTheDocument()
        
        // Fix step 1
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        // Step 1 error indicator should clear
        step1Button = screen.getByRole('button', { name: /Basic Info/i })
        expect(step1Button.querySelector('.ring-red-500')).not.toBeInTheDocument()
        
        // Fix step 2
        const nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        // Step 2 error indicator should clear
        step2Button = screen.getByRole('button', { name: /Ingredients/i })
        expect(step2Button.querySelector('.ring-red-500')).not.toBeInTheDocument()
        
        // Step 3 should still have error
        step3Button = screen.getByRole('button', { name: /Instructions/i })
        expect(step3Button.querySelector('.ring-red-500')).toBeInTheDocument()
      })
    })

    describe('Validation Error Message Display', () => {
      it('should navigate to first error step when validation fails', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should navigate back to step 1 (first error)
        expect(screen.getByText(/Step 1 of 5: Basic Info/i)).toBeInTheDocument()
        expect(screen.getByText('Recipe name is required')).toBeInTheDocument()
      })

      it('should show inline error message with icon for title field', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Check for error message with SVG icon
        const errorText = screen.getByText('Recipe name is required')
        expect(errorText).toHaveClass('text-red-600')
        
        const errorContainer = errorText.closest('p')
        expect(errorContainer?.querySelector('svg')).toBeInTheDocument()
      })

      it('should show error box for ingredients section', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should be on step 2 with error message
        const errorMessage = screen.getByText('At least one ingredient is required')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-red-800')
        
        // Error should be in a red box
        const errorContainer = errorMessage.closest('.bg-red-50')
        expect(errorContainer).toBeInTheDocument()
        expect(errorContainer).toHaveClass('border-red-200')
      })

      it('should show error box for instructions section', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Add recipe name and ingredient
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        const nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        // Navigate to step 4 and try to save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Should be on step 3 with error message
        const errorMessage = screen.getByText('At least one instruction is required')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-red-800')
        
        // Error should be in a red box
        const errorContainer = errorMessage.closest('.bg-red-50')
        expect(errorContainer).toBeInTheDocument()
        expect(errorContainer).toHaveClass('border-red-200')
      })
    })

    describe('Successful Validation', () => {
      it('should allow save when all required fields are filled', async () => {
        const { saveRecipe } = await import('../../services/recipeStorageApi')
        renderWithRouter(<CreateRecipe />)
        
        // Fill required fields
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        let nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const instructionInput = screen.getAllByPlaceholderText(/Describe this step in detail/i)[0]
        fireEvent.change(instructionInput, { target: { value: 'Mix ingredients' } })
        
        // Navigate to step 4 and save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // Save should be called
        expect(saveRecipe).toHaveBeenCalled()
      })

      it('should not show any validation errors when form is valid', async () => {
        renderWithRouter(<CreateRecipe />)
        
        // Fill required fields
        const titleInput = screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
        fireEvent.change(titleInput, { target: { value: 'Test Recipe' } })
        
        let nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const itemInput = screen.getAllByPlaceholderText('e.g., all-purpose flour')[0]
        fireEvent.change(itemInput, { target: { value: 'flour' } })
        
        nextButton = screen.getByRole('button', { name: /Next →/i })
        fireEvent.click(nextButton)
        
        const instructionInput = screen.getAllByPlaceholderText(/Describe this step in detail/i)[0]
        fireEvent.change(instructionInput, { target: { value: 'Mix ingredients' } })
        
        // Navigate to step 4 and save
        const step4Button = screen.getByRole('button', { name: /Review/i })
        fireEvent.click(step4Button)
        
        const saveButton = screen.getByRole('button', { name: /Save Recipe/i })
        fireEvent.click(saveButton)
        
        // No validation errors should be shown
        expect(screen.queryByText('Recipe name is required')).not.toBeInTheDocument()
        expect(screen.queryByText('At least one ingredient is required')).not.toBeInTheDocument()
        expect(screen.queryByText('At least one instruction is required')).not.toBeInTheDocument()
        expect(screen.queryByText('Please fix the validation errors before saving.')).not.toBeInTheDocument()
      })
    })
  })
})


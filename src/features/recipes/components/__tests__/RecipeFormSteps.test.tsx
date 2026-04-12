import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeFormSteps } from '../RecipeFormSteps'
import type { StepRefinementState } from '../../hooks/useInstructionRefinement'
import type { ComponentProps } from 'react'

function makeProps(overrides: Partial<ComponentProps<typeof RecipeFormSteps>> = {}): ComponentProps<typeof RecipeFormSteps> {
  return {
    currentStep: 3,
    title: 'Pasta',
    setTitle: vi.fn(),
    description: '',
    setDescription: vi.fn(),
    prepTime: '',
    setPrepTime: vi.fn(),
    cookTime: '',
    setCookTime: vi.fn(),
    servings: '',
    setServings: vi.fn(),
    imagePreview: null,
    handleImageUpload: vi.fn(),
    removeImage: vi.fn(),
    ingredients: [{ quantity: '', unit: '', item: '' }],
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
    removeIngredient: vi.fn(),
    instructions: ['Boil water', 'Add pasta'],
    addInstruction: vi.fn(),
    updateInstruction: vi.fn(),
    removeInstruction: vi.fn(),
    tags: [],
    tagInput: '',
    setTagInput: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    dietaryRestrictions: [],
    dietaryInput: '',
    setDietaryInput: vi.fn(),
    addDietaryRestriction: vi.fn(),
    removeDietaryRestriction: vi.fn(),
    fieldErrors: {},
    clearFieldError: vi.fn(),
    recipeName: 'Pasta',
    ...overrides,
  }
}

describe('RecipeFormSteps — instruction refinement (issue #37)', () => {
  it('renders "Refine all" button when onRefineAllInstructions is provided', () => {
    render(<RecipeFormSteps {...makeProps({ onRefineAllInstructions: vi.fn() })} />)
    expect(screen.getByRole('button', { name: /Refine all instructions with AI/i })).toBeInTheDocument()
  })

  it('does NOT render "Refine all" button when handler is absent', () => {
    render(<RecipeFormSteps {...makeProps()} />)
    expect(screen.queryByRole('button', { name: /Refine all/i })).not.toBeInTheDocument()
  })

  it('renders per-step ✨ refine button for each instruction when handler is provided', () => {
    render(<RecipeFormSteps {...makeProps({ onRefineInstruction: vi.fn() })} />)
    expect(screen.getAllByRole('button', { name: /Refine step \d+ with AI/i })).toHaveLength(2)
  })

  it('calls onRefineInstruction with correct index when step button clicked', () => {
    const onRefine = vi.fn()
    render(<RecipeFormSteps {...makeProps({ onRefineInstruction: onRefine })} />)
    const [firstBtn] = screen.getAllByRole('button', { name: /Refine step 1 with AI/i })
    fireEvent.click(firstBtn)
    expect(onRefine).toHaveBeenCalledWith(0, 'Boil water')
  })

  it('calls onRefineAllInstructions when "Refine all" is clicked', () => {
    const onRefineAll = vi.fn()
    render(<RecipeFormSteps {...makeProps({ onRefineAllInstructions: onRefineAll })} />)
    fireEvent.click(screen.getByRole('button', { name: /Refine all instructions with AI/i }))
    expect(onRefineAll).toHaveBeenCalledOnce()
  })

  it('shows InstructionDiffView for a step with pending refinement', () => {
    const pendingState: StepRefinementState = {
      original: 'Boil water',
      refined: 'Bring salted water to a rolling boil',
      changesSummary: 'More specific',
      status: 'pending',
    }
    const refinementStates = new Map([[0, pendingState]])
    render(
      <RecipeFormSteps
        {...makeProps({
          instructionRefinementStates: refinementStates,
          onAcceptInstructionRefinement: vi.fn(),
          onRejectInstructionRefinement: vi.fn(),
        })}
      />
    )
    expect(screen.getByRole('button', { name: /✓ Accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /✗ Reject/i })).toBeInTheDocument()
    // Diff view shows some part of the refined text
    expect(screen.getByText(/rolling/i)).toBeInTheDocument()
  })

  it('calls onAcceptInstructionRefinement when Accept is clicked', () => {
    const onAccept = vi.fn()
    const pendingState: StepRefinementState = {
      original: 'Boil water',
      refined: 'Bring salted water to a boil',
      changesSummary: '',
      status: 'pending',
    }
    render(
      <RecipeFormSteps
        {...makeProps({
          instructionRefinementStates: new Map([[0, pendingState]]),
          onAcceptInstructionRefinement: onAccept,
          onRejectInstructionRefinement: vi.fn(),
        })}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /✓ Accept/i }))
    expect(onAccept).toHaveBeenCalledWith(0)
  })

  it('calls onRejectInstructionRefinement when Reject is clicked', () => {
    const onReject = vi.fn()
    const pendingState: StepRefinementState = {
      original: 'Boil water',
      refined: 'Bring salted water to a boil',
      changesSummary: '',
      status: 'pending',
    }
    render(
      <RecipeFormSteps
        {...makeProps({
          instructionRefinementStates: new Map([[0, pendingState]]),
          onAcceptInstructionRefinement: vi.fn(),
          onRejectInstructionRefinement: onReject,
        })}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /✗ Reject/i }))
    expect(onReject).toHaveBeenCalledWith(0)
  })

  it('does not show InstructionDiffView for accepted/rejected steps', () => {
    const acceptedState: StepRefinementState = {
      original: 'Boil water',
      refined: 'Bring salted water to a boil',
      changesSummary: '',
      status: 'accepted',
    }
    render(
      <RecipeFormSteps
        {...makeProps({
          instructionRefinementStates: new Map([[0, acceptedState]]),
          onAcceptInstructionRefinement: vi.fn(),
          onRejectInstructionRefinement: vi.fn(),
        })}
      />
    )
    expect(screen.queryByRole('button', { name: /✓ Accept/i })).not.toBeInTheDocument()
  })
})

describe('RecipeFormSteps — per-field AI enhance (issue #40)', () => {
  it('shows FieldAIEnhanceButton for recipeName when onEnhanceField prop provided', () => {
    render(
      <RecipeFormSteps
        {...makeProps({ currentStep: 1, onEnhanceField: vi.fn() })}
      />
    )
    const buttons = screen.getAllByRole('button', { name: /complete with ai|enhance with ai/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('calls onEnhanceField with field name and current value when icon clicked', () => {
    const onEnhanceField = vi.fn()
    render(
      <RecipeFormSteps
        {...makeProps({ currentStep: 1, title: 'My Recipe', onEnhanceField })}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /enhance with ai/i }))
    expect(onEnhanceField).toHaveBeenCalledWith('recipeName', 'My Recipe')
  })

  it('shows FieldAISuggestionChip when suggestion available for that field', () => {
    render(
      <RecipeFormSteps
        {...makeProps({
          currentStep: 1,
          onEnhanceField: vi.fn(),
          fieldSuggestions: [{ field: 'recipeName', suggestedValue: 'Amazing Pasta', reason: 'Sounds great' }],
          onApplyFieldSuggestion: vi.fn(),
          onDismissFieldSuggestion: vi.fn(),
        })}
      />
    )
    expect(screen.getByText('Amazing Pasta')).toBeInTheDocument()
  })

  it('calls onApplyFieldSuggestion when Apply clicked on chip', () => {
    const onApply = vi.fn()
    render(
      <RecipeFormSteps
        {...makeProps({
          currentStep: 1,
          onEnhanceField: vi.fn(),
          fieldSuggestions: [{ field: 'recipeName', suggestedValue: 'Amazing Pasta', reason: 'Sounds great' }],
          onApplyFieldSuggestion: onApply,
          onDismissFieldSuggestion: vi.fn(),
        })}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(onApply).toHaveBeenCalledWith('recipeName', 'Amazing Pasta')
  })

  it('calls onDismissFieldSuggestion when Dismiss clicked on chip', () => {
    const onDismiss = vi.fn()
    render(
      <RecipeFormSteps
        {...makeProps({
          currentStep: 1,
          onEnhanceField: vi.fn(),
          fieldSuggestions: [{ field: 'recipeName', suggestedValue: 'Amazing Pasta', reason: 'Sounds great' }],
          onApplyFieldSuggestion: vi.fn(),
          onDismissFieldSuggestion: onDismiss,
        })}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledWith('recipeName')
  })
})

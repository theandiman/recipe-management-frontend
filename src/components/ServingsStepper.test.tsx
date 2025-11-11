import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ServingsStepper from './ServingsStepper'

describe('ServingsStepper', () => {
  describe('Non-numeric servings', () => {
    it('should display non-numeric servings as read-only', () => {
      render(
        <ServingsStepper 
          servings="serves 4-6" 
          targetServings={null} 
        />
      )

      expect(screen.getByText('serves 4-6')).toBeInTheDocument()
      expect(screen.queryByLabelText('Decrease servings')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Increase servings')).not.toBeInTheDocument()
    })

    it('should show "—" when servings is null', () => {
      render(
        <ServingsStepper 
          servings={null} 
          targetServings={null} 
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should show "—" when servings is undefined', () => {
      render(
        <ServingsStepper 
          servings={undefined} 
          targetServings={null} 
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('Numeric servings', () => {
    it('should display stepper buttons for numeric servings', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings={4} 
          targetServings={null} 
          setTargetServings={mockSetTargetServings}
        />
      )

      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByLabelText('Decrease servings')).toBeInTheDocument()
      expect(screen.getByLabelText('Increase servings')).toBeInTheDocument()
    })

    it('should parse string numbers correctly', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings="6" 
          targetServings={null} 
          setTargetServings={mockSetTargetServings}
        />
      )

      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByLabelText('Decrease servings')).toBeInTheDocument()
    })

    it('should display target servings when set', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings={4} 
          targetServings={8} 
          setTargetServings={mockSetTargetServings}
        />
      )

      expect(screen.getByText('8')).toBeInTheDocument()
    })
  })

  describe('Increment/Decrement', () => {
    it('should increment servings when + button is clicked', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings={4} 
          targetServings={null} 
          setTargetServings={mockSetTargetServings}
        />
      )

      const incrementButton = screen.getByLabelText('Increase servings')
      fireEvent.click(incrementButton)

      expect(mockSetTargetServings).toHaveBeenCalledWith(5)
    })

    it('should decrement servings when - button is clicked', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings={4} 
          targetServings={null} 
          setTargetServings={mockSetTargetServings}
        />
      )

      const decrementButton = screen.getByLabelText('Decrease servings')
      fireEvent.click(decrementButton)

      expect(mockSetTargetServings).toHaveBeenCalledWith(3)
    })

    it('should not go below 1 serving when decrementing', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings={4} 
          targetServings={1} 
          setTargetServings={mockSetTargetServings}
        />
      )

      const decrementButton = screen.getByLabelText('Decrease servings')
      fireEvent.click(decrementButton)

      expect(mockSetTargetServings).toHaveBeenCalledWith(1) // Min is 1
    })

    it('should use targetServings for increment when set', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings={4} 
          targetServings={6} 
          setTargetServings={mockSetTargetServings}
        />
      )

      const incrementButton = screen.getByLabelText('Increase servings')
      fireEvent.click(incrementButton)

      expect(mockSetTargetServings).toHaveBeenCalledWith(7)
    })

    it('should use targetServings for decrement when set', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings={4} 
          targetServings={6} 
          setTargetServings={mockSetTargetServings}
        />
      )

      const decrementButton = screen.getByLabelText('Decrease servings')
      fireEvent.click(decrementButton)

      expect(mockSetTargetServings).toHaveBeenCalledWith(5)
    })

    it('should not call setTargetServings when undefined', () => {
      render(
        <ServingsStepper 
          servings={4} 
          targetServings={null} 
        />
      )

      const incrementButton = screen.getByLabelText('Increase servings')
      // Should not throw when clicking without setTargetServings
      expect(() => fireEvent.click(incrementButton)).not.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle decimal servings', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings={4.5} 
          targetServings={null} 
          setTargetServings={mockSetTargetServings}
        />
      )

      expect(screen.getByText('4.5')).toBeInTheDocument()
      
      const incrementButton = screen.getByLabelText('Increase servings')
      fireEvent.click(incrementButton)
      
      expect(mockSetTargetServings).toHaveBeenCalledWith(5.5)
    })

    it('should handle string with decimal', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings="3.5" 
          targetServings={null} 
          setTargetServings={mockSetTargetServings}
        />
      )

      expect(screen.getByText('3.5')).toBeInTheDocument()
    })

    it('should treat whitespace-padded numeric strings as numeric', () => {
      const mockSetTargetServings = vi.fn()
      
      render(
        <ServingsStepper 
          servings="  4  " 
          targetServings={null} 
          setTargetServings={mockSetTargetServings}
        />
      )

      expect(screen.getByLabelText('Increase servings')).toBeInTheDocument()
    })
  })
})

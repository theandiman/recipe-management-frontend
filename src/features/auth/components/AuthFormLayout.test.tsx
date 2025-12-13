import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthFormLayout } from './AuthFormLayout'

// Mock child components to isolate AuthFormLayout testing
vi.mock('./AuthBrandHeader', () => ({
  AuthBrandHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="auth-brand-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
}))

vi.mock('./ErrorAlert', () => ({
  ErrorAlert: ({ error }: { error: string | null }) => (
    error ? <div role="alert" data-testid="error-alert">{error}</div> : null
  ),
}))

vi.mock('./GoogleSignInButton', () => ({
  GoogleSignInButton: ({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) => (
    <button onClick={onClick} disabled={disabled} data-testid="google-signin-button">
      {label}
    </button>
  ),
}))

vi.mock('./AuthDivider', () => ({
  AuthDivider: ({ text }: { text: string }) => (
    <div data-testid="auth-divider">{text}</div>
  ),
}))

describe('AuthFormLayout', () => {
  const defaultProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    children: <input data-testid="test-input" />,
    onSubmit: vi.fn(),
    error: null,
    isLoading: false,
    isSubmitting: false,
    submitText: 'Submit',
    submittingText: 'Submitting...',
    onGoogleSignIn: vi.fn(),
    googleButtonLabel: 'Sign in with Google',
    bottomDividerText: 'Or',
    bottomButtonText: 'Bottom Action',
    bottomButtonAction: vi.fn(),
  }

  it('should render with all required props', () => {
    render(<AuthFormLayout {...defaultProps} />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
    expect(screen.getByTestId('test-input')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
    expect(screen.getByText('Bottom Action')).toBeInTheDocument()
    expect(screen.getByText('Protected by Firebase Authentication')).toBeInTheDocument()
  })

  it('should render children content', () => {
    render(
      <AuthFormLayout {...defaultProps}>
        <div data-testid="custom-content">Custom Form Content</div>
      </AuthFormLayout>
    )
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    expect(screen.getByText('Custom Form Content')).toBeInTheDocument()
  })

  it('should call onSubmit when form is submitted', () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<AuthFormLayout {...defaultProps} onSubmit={onSubmit} />)
    
    const form = screen.getByRole('button', { name: /submit/i }).closest('form')!
    fireEvent.submit(form)
    
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('should display error when error prop is provided', () => {
    render(<AuthFormLayout {...defaultProps} error="Test error message" />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should not display error alert when error is null', () => {
    render(<AuthFormLayout {...defaultProps} error={null} />)
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  describe('Submit Button', () => {
    it('should show submit text when not loading or submitting', () => {
      render(<AuthFormLayout {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      expect(submitButton).toHaveTextContent('Submit')
      expect(submitButton).not.toBeDisabled()
    })

    it('should show submitting text when isSubmitting is true', () => {
      render(<AuthFormLayout {...defaultProps} isSubmitting={true} />)
      
      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton).toHaveTextContent('Submitting...')
      expect(submitButton).toBeDisabled()
    })

    it('should show submitting text when isLoading is true', () => {
      render(<AuthFormLayout {...defaultProps} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton).toHaveTextContent('Submitting...')
      expect(submitButton).toBeDisabled()
    })

    it('should be disabled when isLoading is true', () => {
      render(<AuthFormLayout {...defaultProps} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton).toBeDisabled()
    })

    it('should be disabled when isSubmitting is true', () => {
      render(<AuthFormLayout {...defaultProps} isSubmitting={true} />)
      
      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton).toBeDisabled()
    })

    it('should display loading spinner when submitting', () => {
      render(<AuthFormLayout {...defaultProps} isSubmitting={true} />)
      
      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton.querySelector('svg')).toBeInTheDocument()
    })

    it('should display arrow icon when not submitting', () => {
      render(<AuthFormLayout {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      const svg = submitButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Google Sign-In', () => {
    it('should call onGoogleSignIn when Google button is clicked', () => {
      const onGoogleSignIn = vi.fn()
      render(<AuthFormLayout {...defaultProps} onGoogleSignIn={onGoogleSignIn} />)
      
      const googleButton = screen.getByText('Sign in with Google')
      fireEvent.click(googleButton)
      
      expect(onGoogleSignIn).toHaveBeenCalledTimes(1)
    })

    it('should disable Google sign-in button when isLoading is true', () => {
      render(<AuthFormLayout {...defaultProps} isLoading={true} />)
      
      const googleButton = screen.getByText('Sign in with Google').closest('button')!
      expect(googleButton).toBeDisabled()
    })

    it('should render custom Google button label', () => {
      render(<AuthFormLayout {...defaultProps} googleButtonLabel="Custom Google Label" />)
      
      expect(screen.getByText('Custom Google Label')).toBeInTheDocument()
    })
  })

  describe('Bottom Navigation', () => {
    it('should call bottomButtonAction when bottom button is clicked', () => {
      const bottomButtonAction = vi.fn()
      render(<AuthFormLayout {...defaultProps} bottomButtonAction={bottomButtonAction} />)
      
      const bottomButton = screen.getByText('Bottom Action')
      fireEvent.click(bottomButton)
      
      expect(bottomButtonAction).toHaveBeenCalledTimes(1)
    })

    it('should render custom bottom button text', () => {
      render(<AuthFormLayout {...defaultProps} bottomButtonText="Custom Bottom Text" />)
      
      expect(screen.getByText('Custom Bottom Text')).toBeInTheDocument()
    })

    it('should render custom bottom divider text', () => {
      render(<AuthFormLayout {...defaultProps} bottomDividerText="Custom Divider" />)
      
      expect(screen.getByText('Custom Divider')).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should render main container with proper styling', () => {
      const { container } = render(<AuthFormLayout {...defaultProps} />)
      
      const mainContainer = container.querySelector('.min-h-screen')
      expect(mainContainer).toBeInTheDocument()
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('should render form card with proper styling', () => {
      const { container } = render(<AuthFormLayout {...defaultProps} />)
      
      const formCard = container.querySelector('.bg-white.rounded-2xl')
      expect(formCard).toBeInTheDocument()
    })

    it('should render both dividers', () => {
      render(<AuthFormLayout {...defaultProps} />)
      
      expect(screen.getByText('Or continue with')).toBeInTheDocument()
      expect(screen.getByText(defaultProps.bottomDividerText)).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should handle complete form submission flow', () => {
      const onSubmit = vi.fn((e) => e.preventDefault())
      render(
        <AuthFormLayout {...defaultProps} onSubmit={onSubmit}>
          <input data-testid="email-input" type="email" />
        </AuthFormLayout>
      )
      
      const form = screen.getByRole('button', { name: /submit/i }).closest('form')!
      fireEvent.submit(form)
      
      expect(onSubmit).toHaveBeenCalled()
    })

    it('should render all interactive elements', () => {
      render(<AuthFormLayout {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3) // Submit, Google sign-in, Bottom action
    })

    it('should maintain proper button order', () => {
      render(<AuthFormLayout {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toHaveTextContent('Submit')
      expect(buttons[1]).toHaveTextContent('Sign in with Google')
      expect(buttons[2]).toHaveTextContent('Bottom Action')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty error string', () => {
      render(<AuthFormLayout {...defaultProps} error="" />)
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should handle long error messages', () => {
      const longError = 'This is a very long error message that should still be displayed correctly in the component without breaking the layout or causing any issues'
      render(<AuthFormLayout {...defaultProps} error={longError} />)
      
      expect(screen.getByText(longError)).toBeInTheDocument()
    })

    it('should handle simultaneous isLoading and isSubmitting', () => {
      render(<AuthFormLayout {...defaultProps} isLoading={true} isSubmitting={true} />)
      
      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('Submitting...')
    })

    it('should handle multiple children elements', () => {
      render(
        <AuthFormLayout {...defaultProps}>
          <input data-testid="input-1" />
          <input data-testid="input-2" />
          <input data-testid="input-3" />
        </AuthFormLayout>
      )
      
      expect(screen.getByTestId('input-1')).toBeInTheDocument()
      expect(screen.getByTestId('input-2')).toBeInTheDocument()
      expect(screen.getByTestId('input-3')).toBeInTheDocument()
    })
  })
})

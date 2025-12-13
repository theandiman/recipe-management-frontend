import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { RegisterData } from '../../types/auth'
import { AuthFormLayout } from './components/AuthFormLayout'
import { AuthFormInput } from './components/AuthFormInput'
import { useAuthValidation } from './hooks/useAuthValidation'
import { useGoogleSignIn } from './hooks/useGoogleSignIn'
import { useAuthForm } from './hooks/useAuthForm'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { register, isLoading, error } = useAuth()
  const { validateRegisterForm } = useAuthValidation()
  const { handleGoogleSignIn } = useGoogleSignIn()
  
  const form = useAuthForm<RegisterData>({
    initialValues: {
      email: '',
      password: '',
      name: '',
    },
    validate: (values) => validateRegisterForm(values.email, values.password, values.name),
    onSubmit: async (values) => {
      await register(values)
      navigate('/dashboard')
    }
  })

  return (
    <AuthFormLayout
      title="Join CookFlow"
      subtitle="Create your account to get started"
      onSubmit={form.handleSubmit}
      error={error}
      isLoading={isLoading}
      isSubmitting={form.isSubmitting}
      submitText="Create account"
      submittingText="Creating account..."
      onGoogleSignIn={handleGoogleSignIn}
      googleButtonLabel="Sign up with Google"
      bottomDividerText="Already have an account?"
      bottomButtonText="Sign in instead"
      bottomButtonAction={() => navigate('/login')}
    >
      <AuthFormInput
        id="name"
        name="name"
        type="text"
        label="Full name"
        placeholder="John Doe"
        value={form.values.name}
        onChange={form.handleChange}
        error={form.errors.name}
        autoComplete="name"
        required
        icon={
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      />
      
      <AuthFormInput
        id="email"
        name="email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={form.values.email}
        onChange={form.handleChange}
        error={form.errors.email}
        autoComplete="email"
        required
        icon={
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />
      
      <AuthFormInput
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        value={form.values.password}
        onChange={form.handleChange}
        error={form.errors.password}
        autoComplete="new-password"
        required
        icon={
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
      />
    </AuthFormLayout>
  )
}

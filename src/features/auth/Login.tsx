import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { LoginCredentials } from '../../types/auth'
import { AuthFormLayout } from './components/AuthFormLayout'
import { AuthFormInput } from './components/AuthFormInput'
import { useAuthValidation } from './hooks/useAuthValidation'
import { useGoogleSignIn } from './hooks/useGoogleSignIn'
import { useAuthForm } from './hooks/useAuthForm'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const { validateLoginForm } = useAuthValidation()
  const { handleGoogleSignIn } = useGoogleSignIn()
  
  const form = useAuthForm<LoginCredentials>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: (values) => validateLoginForm(values.email, values.password),
    onSubmit: async (values) => {
      await login(values)
      navigate('/dashboard')
    }
  })

  return (
    <AuthFormLayout
      title="Welcome Back"
      subtitle="Sign in to access your recipes"
      onSubmit={form.handleSubmit}
      error={error}
      isLoading={isLoading}
      isSubmitting={form.isSubmitting}
      submitText="Sign in"
      submittingText="Signing in..."
      onGoogleSignIn={handleGoogleSignIn}
      googleButtonLabel="Sign in with Google"
      bottomDividerText="New to CookFlow?"
      bottomButtonText="Create an account"
      bottomButtonAction={() => navigate('/register')}
    >
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
        autoComplete="current-password"
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

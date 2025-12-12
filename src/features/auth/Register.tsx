import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './AuthContext'
import type { RegisterData } from '../../types/auth'
import { AuthBrandHeader } from './components/AuthBrandHeader'
import { ErrorAlert } from './components/ErrorAlert'
import { AuthFormInput } from './components/AuthFormInput'
import { GoogleSignInButton } from './components/GoogleSignInButton'
import { AuthDivider } from './components/AuthDivider'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-12">
      <div className="max-w-md w-full">
        <AuthBrandHeader 
          title="Join CookFlow"
          subtitle="Create your account to get started"
        />
        
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <form className="space-y-6" onSubmit={form.handleSubmit}>
            <ErrorAlert error={error} />
            
            <div className="space-y-5">
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
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || form.isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 transform hover:scale-[1.02]"
              >
                {isLoading || form.isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <AuthDivider text="Or continue with" />
            
            <div className="mt-6">
              <GoogleSignInButton
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                label="Sign up with Google"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <AuthDivider text="Already have an account?" />
            
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-200"
              >
                Sign in instead
                <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
        
        <p className="mt-8 text-center text-xs text-gray-500">
          Protected by Firebase Authentication
        </p>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './AuthContext'
import type { LoginCredentials } from '../../types/auth'
import { AuthBrandHeader } from './components/AuthBrandHeader'
import { ErrorAlert } from './components/ErrorAlert'
import { AuthFormInput } from './components/AuthFormInput'
import { GoogleSignInButton } from './components/GoogleSignInButton'
import { AuthDivider } from './components/AuthDivider'
import { useAuthValidation } from './hooks/useAuthValidation'
import { useGoogleSignIn } from './hooks/useGoogleSignIn'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const { validateLoginForm } = useAuthValidation()
  const { handleGoogleSignIn } = useGoogleSignIn()
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  
  const [validationErrors, setValidationErrors] = useState<Partial<LoginCredentials>>({})

  const validate = (): boolean => {
    const errors = validateLoginForm(credentials.email, credentials.password)
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    try {
      await login(credentials)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({ ...prev, [name]: value }))
    if (validationErrors[name as keyof LoginCredentials]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-12">
      <motion.div 
        className="max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AuthBrandHeader 
          title="Welcome Back"
          subtitle="Sign in to access your recipes"
        />
        
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <ErrorAlert error={error} />
            
            <div className="space-y-5">
              <AuthFormInput
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={credentials.email}
                onChange={handleChange}
                error={validationErrors.email}
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
                value={credentials.password}
                onChange={handleChange}
                error={validationErrors.password}
                autoComplete="current-password"
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
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
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
                label="Sign in with Google"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <AuthDivider text="New to CookFlow?" />
            
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-200"
              >
                Create an account
                <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
        
        <motion.p 
          className="mt-8 text-center text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          Protected by Firebase Authentication
        </motion.p>
      </motion.div>
    </div>
  )
}

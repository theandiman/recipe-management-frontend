import React from 'react'
import { motion } from 'framer-motion'
import { AuthBrandHeader } from './AuthBrandHeader'
import { ErrorAlert } from './ErrorAlert'
import { GoogleSignInButton } from './GoogleSignInButton'
import { AuthDivider } from './AuthDivider'

interface AuthFormLayoutProps {
  // Header
  title: string
  subtitle: string
  
  // Form
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  error: string | null
  
  // Submit button
  isLoading: boolean
  isSubmitting: boolean
  submitText: string
  submittingText: string
  
  // Google Sign-In
  onGoogleSignIn: () => void
  googleButtonLabel: string
  
  // Bottom navigation
  bottomDividerText: string
  bottomButtonText: string
  bottomButtonAction: () => void
}

export const AuthFormLayout: React.FC<AuthFormLayoutProps> = ({
  title,
  subtitle,
  children,
  onSubmit,
  error,
  isLoading,
  isSubmitting,
  submitText,
  submittingText,
  onGoogleSignIn,
  googleButtonLabel,
  bottomDividerText,
  bottomButtonText,
  bottomButtonAction,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-12">
      <motion.div 
        className="max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AuthBrandHeader title={title} subtitle={subtitle} />
        
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <form className="space-y-6" onSubmit={onSubmit}>
            <ErrorAlert error={error} />
            
            <div className="space-y-5">
              {children}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 transform hover:scale-[1.02]"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {submittingText}
                  </>
                ) : (
                  <>
                    {submitText}
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
                onClick={onGoogleSignIn}
                disabled={isLoading}
                label={googleButtonLabel}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <AuthDivider text={bottomDividerText} />
            
            <div className="mt-6">
              <button
                type="button"
                onClick={bottomButtonAction}
                className="w-full flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-200"
              >
                {bottomButtonText}
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
          transition={{ delay: 1 }}
        >
          Protected by Firebase Authentication
        </motion.p>
      </motion.div>
    </div>
  )
}

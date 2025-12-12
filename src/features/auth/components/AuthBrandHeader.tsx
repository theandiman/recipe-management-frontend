import React from 'react'
import { motion } from 'framer-motion'

interface AuthBrandHeaderProps {
  title: string
  subtitle: string
}

export const AuthBrandHeader: React.FC<AuthBrandHeaderProps> = ({ title, subtitle }) => {
  return (
    <motion.div 
      className="text-center mb-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div 
        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl mb-4 shadow-lg relative"
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18v-5m0 0V7m0 6l-3-3m3 3l3-3" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} fill="none" />
        </svg>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"></div>
      </motion.div>
      <motion.h1 
        className="text-3xl font-bold text-gray-800 mb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        CookFlow
      </motion.h1>
      <motion.p 
        className="text-sm text-gray-500 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        Seamlessly Organized. Deliciously Simple.
      </motion.p>
      <motion.h2 
        className="text-2xl font-semibold text-gray-700"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        {title}
      </motion.h2>
      <motion.p 
        className="mt-2 text-sm text-gray-600"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        {subtitle}
      </motion.p>
    </motion.div>
  )
}

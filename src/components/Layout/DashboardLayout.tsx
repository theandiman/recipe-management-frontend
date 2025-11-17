import React, { useState, useEffect } from 'react'
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../features/auth/AuthContext'
import { Dashboard } from '../Dashboard'
import { RecipeLibrary } from '../../features/recipes/RecipeLibrary'
import { RecipeDetail } from '../../features/recipes/RecipeDetail'
import { CreateRecipe } from '../../features/recipes/CreateRecipe'
import { AIGenerator } from '../../features/recipes/AIGenerator'

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  // Start with sidebar closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024)

  // Handle window resize to auto-open/close sidebar
  useEffect(() => {
    const handleResize = () => {
      // On desktop (lg breakpoint = 1024px), keep sidebar open
      // On mobile, keep it closed unless user opens it
      if (window.innerWidth >= 1024 && !isSidebarOpen) {
        setIsSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isSidebarOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
    },
    {
      name: 'Browse Recipes',
      path: '/dashboard/recipes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Create Recipe',
      path: '/dashboard/create',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      name: 'AI Generator',
      path: '/dashboard/generate',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: 'AI',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "tween"
            }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200"
          >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center relative">
                {/* Whisk icon */}
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18v-5m0 0V7m0 6l-3-3m3 3l3-3" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} fill="none" />
                </svg>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full"></div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <span className="text-xl font-bold text-gray-800">
                  CookFlow
                </span>
                <p className="text-xs text-gray-500 -mt-0.5">Seamlessly Organized</p>
              </motion.div>
            </motion.div>
            <motion.button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <NavLink
                  to={item.path}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false)
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <motion.div
                    className="flex items-center justify-between w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center space-x-3">
                      <motion.div
                        whileHover={{ rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.icon}
                      </motion.div>
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* User Profile Section */}
          <motion.div
            className="border-t border-gray-200 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  {user?.email?.[0].toUpperCase() || 'U'}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">Signed in</p>
                </div>
              </div>
            </div>
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </motion.svg>
              <span>Sign out</span>
            </motion.button>
          </motion.div>
        </div>
          </motion.aside>
        )}
      </AnimatePresence>      {/* Main Content Area */}
      <div className="lg:pl-64 transition-all duration-300">
  {/* Top Bar (transparent) */}
  <header className="sticky top-0 z-60 bg-transparent border-b-0 px-4 py-1">
    <div className="flex items-center">
      <motion.button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </motion.button>
      <div className="ml-3 flex-1" />
    </div>
  </header>

        {/* Page Content */}
        <main className="p-4 bg-gray-50">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="recipes/*" element={<RecipeLibrary />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="create" element={<CreateRecipe />} />
            <Route path="generate" element={<AIGenerator />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}

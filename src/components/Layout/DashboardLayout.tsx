import React, { useState, useEffect } from 'react'
import { NavLink, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../features/auth/AuthContext'
import { Dashboard } from '../Dashboard'
import { ThemeToggle } from '../ThemeToggle'
import { RecipeLibrary } from '../../features/recipes/RecipeLibrary'
import { RecipeDetail } from '../../features/recipes/RecipeDetail'
import { CreateRecipe } from '../../features/recipes/CreateRecipe'
import { SimpleCreateRecipe } from '../../features/recipes/SimpleCreateRecipe'
import { AIGenerator } from '../../features/recipes/AIGenerator'
import { HelpPage } from '../../features/help/HelpPage'
import { CommunityPage } from '../../features/community/CommunityPage'
import { SavedRecipesPage } from '../../features/recipes/SavedRecipesPage'
import { UserProfilePage } from '../../features/users/UserProfilePage'
import { OmniSearchProvider, useOmniSearch } from '../search/OmniSearchContext'

const DashboardLayoutInner: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { searchQuery, setSearchQuery, openOmniSearch } = useOmniSearch()

  const hideTopSearchOnRoutes = ['/dashboard/create', '/dashboard/generate', '/dashboard/help', '/dashboard/profile']
  const showTopSearch = !hideTopSearchOnRoutes.some(p => location.pathname.startsWith(p))
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
      name: 'My Cookbook',
      path: '/dashboard/recipes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Saved Recipes',
      path: '/dashboard/saved',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      ),
    },
    {
      name: 'Community',
      path: '/dashboard/community',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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
      name: 'AI Kitchen',
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
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
            className="fixed inset-y-4 left-4 z-50 w-64 h-[calc(100vh-2rem)] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-slate-700 rounded-3xl shadow-2xl transition-colors duration-300 overflow-hidden flex flex-col"
          >
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700">
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
                <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  CookFlow
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">Seamlessly Organized</p>
              </motion.div>
            </motion.div>
            <motion.button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
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
                        className="px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded-full"
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
            className="border-t border-gray-200 dark:border-slate-700 p-4 pb-12 lg:pb-4 transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <div
              onClick={() => {
                navigate('/dashboard/profile')
                if (window.innerWidth < 1024) setIsSidebarOpen(false)
              }}
              className="flex items-center justify-between mb-3 cursor-pointer p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
              title="View & Edit My Profile"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  {user?.displayName?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || 'U'}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.displayName || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">View & Edit Profile</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NavLink
                to="/dashboard/help"
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Help & Support"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Help</span>
              </NavLink>
              <motion.button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
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
            </div>
          </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>      {/* Main Content Area */}
      <div className="lg:pl-[19rem] transition-all duration-300">
  {/* Top Bar (transparent) */}
  <header className="sticky top-0 z-[60] bg-transparent border-b-0 px-4 py-1">
    <div className="flex items-center">
      {!isSidebarOpen && (
      <motion.button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </motion.button>
      )}
      <div className="ml-3 flex-1" />
      <div className="flex items-center gap-2">
        {showTopSearch && (
          <div className="relative flex items-center">
            <svg className="w-4 h-4 text-emerald-500 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes, tags..."
              className="pl-9 pr-14 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-gray-200/80 dark:border-slate-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-xs font-medium w-44 sm:w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs transition-all"
            />
            <button
              type="button"
              onClick={() => openOmniSearch(searchQuery)}
              className="absolute right-2 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded hover:text-emerald-500 transition-colors"
              title="Open Command Palette (Cmd+K)"
            >
              ⌘K
            </button>
          </div>
        )}
        <button
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          title="My Profile & Settings"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.displayName?.[0].toUpperCase()|| user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">My Profile</span>
        </button>
        <ThemeToggle />
      </div>
    </div>
  </header>

        {/* Page Content */}
        <main className="p-4 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="user/:uid" element={<UserProfilePage />} />
            <Route path="recipes/*" element={<RecipeLibrary />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="recipes/edit/:id" element={<SimpleCreateRecipe />} />
            <Route path="create" element={<CreateRecipe />} />
            <Route path="create/simple" element={<SimpleCreateRecipe />} />
            <Route path="generate" element={<AIGenerator />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="saved" element={<SavedRecipesPage />} />
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

export const DashboardLayout: React.FC = () => (
  <OmniSearchProvider>
    <DashboardLayoutInner />
  </OmniSearchProvider>
)

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export const NewUserOnboarding: React.FC = () => {
  const navigate = useNavigate()

  const onramps = [
    {
      title: 'Discover the Community',
      description: 'Explore recipes from home cooks, follow creators, and bookmark dishes to try.',
      icon: (
        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      actionText: 'Explore Community',
      path: '/dashboard/community',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      title: 'Create Your First Recipe',
      description: 'Document your signature dish with detailed steps, photos, and ingredients.',
      icon: (
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      actionText: 'Create Recipe',
      path: '/dashboard/create',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      title: 'Generate with AI',
      description: 'Have ingredients ready? Let our AI chef craft an instant personalized recipe.',
      icon: (
        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      actionText: 'Try AI Generator',
      path: '/dashboard/generate',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200 dark:border-slate-700 transition-colors"
      aria-labelledby="onboarding-heading"
    >
      <div className="max-w-2xl mb-6">
        <h2 id="onboarding-heading" className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          Get started with CookFlow
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Whether you want to discover exciting dishes from other cooks or document your own creations, here are three great ways to start:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {onramps.map((item) => (
          <div
            key={item.title}
            className="flex flex-col justify-between p-5 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-750 flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                {item.description}
              </p>
            </div>

            <button
              onClick={() => navigate(item.path)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center ${item.buttonClass}`}
            >
              {item.actionText}
            </button>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

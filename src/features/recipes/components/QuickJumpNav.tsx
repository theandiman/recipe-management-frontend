import React, { useEffect, useState } from 'react'

interface QuickJumpNavProps {
  hasNutrition?: boolean
  hasTips?: boolean
  hasComments?: boolean
}

export const QuickJumpNav: React.FC<QuickJumpNavProps> = ({
  hasNutrition = true,
  hasTips = true,
  hasComments = true,
}) => {
  const [activeId, setActiveId] = useState<string>('ingredients-section')

  const navItems = [
    { id: 'ingredients-section', label: 'Ingredients', icon: '📋' },
    { id: 'instructions-section', label: 'Instructions', icon: '👩‍🍳' },
    ...(hasNutrition ? [{ id: 'nutrition-section', label: 'Nutrition', icon: '🥗' }] : []),
    ...(hasTips ? [{ id: 'tips-section', label: 'Tips', icon: '💡' }] : []),
    ...(hasComments ? [{ id: 'recipe-comments-section', label: 'Discussion', icon: '💬' }] : []),
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140

      for (let i = navItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(navItems[i].id)
        if (el && el.offsetTop <= scrollPosition) {
          setActiveId(navItems[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [navItems])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -90
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveId(id)
    }
  }

  return (
    <nav
      aria-label="Quick recipe navigation"
      className="sticky top-16 z-20 mb-6 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-gray-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 shadow-xs transition-all"
    >
      <div className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeId === item.id
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs scale-102'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

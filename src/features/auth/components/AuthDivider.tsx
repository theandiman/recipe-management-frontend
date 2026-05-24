import React from 'react'

interface AuthDividerProps {
  text: string
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">{text}</span>
      </div>
    </div>
  )
}

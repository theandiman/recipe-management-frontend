import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../features/theme/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 overflow-hidden ${
        theme === 'dark' ? 'bg-slate-700' : 'bg-emerald-100'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle Dark Mode"
      aria-pressed={theme === 'dark'}
    >
      {/* Background stars for dark mode */}
      {theme === 'dark' && (
        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          <div className="absolute top-1 w-0.5 h-0.5 left-2 bg-white rounded-full opacity-70"></div>
          <div className="absolute top-3 w-px h-px left-4 bg-white rounded-full opacity-50"></div>
          <div className="absolute top-2 w-0.5 h-0.5 left-6 bg-white rounded-full opacity-80"></div>
        </div>
      )}
      
      {/* Clouds for light mode */}
      {theme === 'light' && (
        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          <div className="absolute top-4 w-4 h-4 left-2 bg-white rounded-full opacity-80 blur-[1px]"></div>
          <div className="absolute top-3 w-5 h-5 left-5 bg-white rounded-full opacity-80 blur-[1px]"></div>
        </div>
      )}

      {/* Toggle circle */}
      <motion.span
        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-md z-10 flex items-center justify-center p-1"
        initial={false}
        animate={{
          x: theme === 'dark' ? 28 : 4
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {theme === 'light' ? (
          <span className="text-amber-400 w-full h-full block">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
          </span>
        ) : (
          <span className="text-slate-700 w-full h-full block">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </motion.span>
    </motion.button>
  );
};

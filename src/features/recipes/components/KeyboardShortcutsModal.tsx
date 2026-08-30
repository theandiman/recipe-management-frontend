import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface KeyboardShortcutsModalProps {
  isOpen?: boolean
  onClose?: () => void
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const handleClose = externalOnClose || (() => setInternalIsOpen(false))
  const handleOpen = () => setInternalIsOpen(true)

  const shortcuts = [
    { key: 'C', description: 'Launch Cook Mode' },
    { key: 'L', description: 'Toggle Like' },
    { key: 'B', description: 'Toggle Bookmark' },
    { key: 'I', description: 'Jump to Ingredients' },
    { key: '?', description: 'Toggle Keyboard Shortcuts Legend' },
  ]

  return (
    <>
      {/* Floating Bottom Corner Helper Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        title="Keyboard Shortcuts (?)"
        aria-label="Keyboard Shortcuts"
        className="fixed bottom-5 right-5 z-40 print:hidden flex items-center gap-2 px-3.5 py-2 bg-slate-900/85 hover:bg-slate-900 text-white border border-white/15 rounded-full shadow-lg backdrop-blur-md text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
      >
        <span className="text-sm">⌨️</span>
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⌨️</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5">
                {shortcuts.map((sc) => (
                  <div
                    key={sc.key}
                    className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800/80"
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {sc.description}
                    </span>
                    <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-xs font-mono font-bold rounded-lg shadow-xs">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 text-center">
                Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-[10px]">Esc</kbd> or click outside to dismiss.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

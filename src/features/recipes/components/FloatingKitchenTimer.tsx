import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTimeRemaining, playChimeSound } from '../utils/timerParser'

export interface KitchenTimerState {
  id: string
  label: string
  totalSeconds: number
  remainingSeconds: number
  isRunning: boolean
}

interface FloatingKitchenTimerProps {
  timer: KitchenTimerState | null
  onClose: () => void
  onUpdateTimer: (updater: (prev: KitchenTimerState | null) => KitchenTimerState | null) => void
}

export const FloatingKitchenTimer: React.FC<FloatingKitchenTimerProps> = ({
  timer,
  onClose,
  onUpdateTimer,
}) => {
  const [hasChimed, setHasChimed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!timer || !timer.isRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      onUpdateTimer((prev) => {
        if (!prev || !prev.isRunning) return prev

        if (prev.remainingSeconds <= 1) {
          if (!hasChimed) {
            playChimeSound()
            setHasChimed(true)
          }
          return { ...prev, remainingSeconds: 0, isRunning: false }
        }

        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 }
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timer?.isRunning, hasChimed, onUpdateTimer])

  if (!timer) return null

  const isCompleted = timer.remainingSeconds === 0
  const progressPercent = Math.min(
    100,
    Math.max(0, ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100)
  )

  const togglePlayPause = () => {
    onUpdateTimer((prev) => (prev ? { ...prev, isRunning: !prev.isRunning } : null))
  }

  const addOneMinute = () => {
    onUpdateTimer((prev) =>
      prev
        ? {
            ...prev,
            totalSeconds: prev.totalSeconds + 60,
            remainingSeconds: prev.remainingSeconds + 60,
            isRunning: true,
          }
        : null
    )
    setHasChimed(false)
  }

  const resetTimer = () => {
    onUpdateTimer((prev) =>
      prev ? { ...prev, remainingSeconds: prev.totalSeconds, isRunning: false } : null
    )
    setHasChimed(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 print:hidden w-80 sm:w-96 bg-slate-900/90 text-white border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden p-4"
      >
        {/* Progress bar background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-2 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-base ${isCompleted ? 'animate-bounce' : ''}`}>
              {isCompleted ? '🔔' : '⏱️'}
            </span>
            <h4 className="text-xs font-bold text-slate-200 truncate">{timer.label}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
            aria-label="Dismiss timer"
          >
            ✕
          </button>
        </div>

        {/* Timer Display */}
        <div className="flex items-baseline justify-between my-2">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {formatTimeRemaining(timer.remainingSeconds)}
          </div>
          {isCompleted && (
            <span className="text-xs font-bold text-emerald-400 animate-pulse">
              Timer Complete!
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={togglePlayPause}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timer.isRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
            }`}
          >
            {timer.isRunning ? '⏸️ Pause' : isCompleted ? '▶️ Restart' : '▶️ Start'}
          </button>

          <button
            type="button"
            onClick={addOneMinute}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            +1 min
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

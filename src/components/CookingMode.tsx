import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Recipe } from '../types/nutrition'

interface CookingModeProps {
  recipe: Recipe
  onClose: () => void
}

interface ISpeechEvent {
  results: {
    length: number
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface ISpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: ISpeechEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

// Helper to extract duration in seconds from instruction text (e.g. "Bake for 30 minutes")
function parseStepTimerSeconds(text: string): number | null {
  const match = text.match(/(\d+)\s*(hour|hr|minute|min|second|sec)s?/i)
  if (!match) return null

  const value = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()

  if (unit.startsWith('hour') || unit.startsWith('hr')) return value * 3600
  if (unit.startsWith('min')) return value * 60
  if (unit.startsWith('sec')) return value
  return null
}

function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getInstructionTextStyle(text: string): string {
  const len = text.length
  if (len < 50) {
    return 'text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center text-white'
  }
  if (len < 120) {
    return 'text-xl sm:text-2xl md:text-3xl font-semibold leading-snug text-center text-slate-100'
  }
  if (len < 240) {
    return 'text-lg sm:text-xl font-medium leading-relaxed text-left text-slate-200'
  }
  return 'text-base sm:text-lg font-normal leading-relaxed text-left text-slate-200'
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null)

  // Interactive Checklist for Ingredients
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({})

  // Built-in Step Timer
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Speech Synthesis Read-Aloud
  const [isSpeaking, setIsSpeaking] = useState(false)

  const totalSteps = recipe.instructions.length
  const progress = ((currentStep + 1) / totalSteps) * 100
  const currentInstruction = recipe.instructions[currentStep] || ''
  const isLastStep = currentStep === totalSteps - 1

  // Detect timer in current step
  useEffect(() => {
    const detected = parseStepTimerSeconds(currentInstruction)
    setTimerSeconds(detected)
    setTimerRemaining(detected)
    setIsTimerRunning(false)
  }, [currentInstruction, currentStep])

  // Timer Countdown Effect
  useEffect(() => {
    if (!isTimerRunning || timerRemaining === null || timerRemaining <= 0) return

    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setIsTimerRunning(false)
          // Play notification audio tone if available
          if ('vibrate' in navigator) {
            try { navigator.vibrate([200, 100, 200]) } catch {}
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, timerRemaining])

  // Screen Wake Lock
  useEffect(() => {
    let wakeLock: unknown = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (
            navigator as unknown as {
              wakeLock: { request: (type: string) => Promise<unknown> }
            }
          ).wakeLock.request('screen')
        }
      } catch {
        // Fallback for unsupported browsers
      }
    }
    requestWakeLock()
    return () => {
      if (wakeLock && typeof (wakeLock as { release?: () => void }).release === 'function') {
        ;(wakeLock as { release: () => void }).release()
      }
    }
  }, [])

  // Keyboard Shortcuts Navigation (Left, Right, Space, KeyV, KeyI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if target is input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowRight') {
        goToNextStep()
      } else if (e.key === 'ArrowLeft') {
        goToPreviousStep()
      } else if (e.key === 'v' || e.key === 'V') {
        toggleVoiceCommands()
      } else if (e.key === 'i' || e.key === 'I') {
        setShowIngredients((prev) => !prev)
      } else if (e.key === 'r' || e.key === 'R') {
        toggleReadStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, totalSteps, isListening])

  // Web Speech API Voice Recognition
  useEffect(() => {
    if (!isListening) return

    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognition
      webkitSpeechRecognition?: new () => ISpeechRecognition
    }

    const SpeechRecognitionClass =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setVoiceFeedback('Voice recognition not supported in this browser')
      return
    }

    let recognition: ISpeechRecognition | null = null
    try {
      recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: ISpeechEvent) => {
        const lastIndex = event.results.length - 1
        const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase()

        if (
          transcript.includes('next') ||
          transcript.includes('forward') ||
          transcript.includes('continue')
        ) {
          setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev))
          setVoiceFeedback('Heard: "Next"')
        } else if (transcript.includes('back') || transcript.includes('previous')) {
          setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
          setVoiceFeedback('Heard: "Back"')
        } else if (transcript.includes('ingredient') || transcript.includes('ingredients')) {
          setShowIngredients(true)
          setVoiceFeedback('Heard: "Ingredients"')
        } else if (
          transcript.includes('step') ||
          transcript.includes('steps') ||
          transcript.includes('instruction')
        ) {
          setShowIngredients(false)
          setVoiceFeedback('Heard: "View Steps"')
        } else if (
          transcript.includes('read') ||
          transcript.includes('repeat') ||
          transcript.includes('speak')
        ) {
          readCurrentStep()
          setVoiceFeedback('Reading step out loud...')
        } else {
          setVoiceFeedback(`Listening... (Heard: "${transcript}")`)
        }
      }

      recognition.onerror = (err: { error: string }) => {
        if (err.error !== 'no-speech') {
          setVoiceFeedback(`Listening... Say 'Next', 'Back', or 'Ingredients'`)
        }
      }

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition?.start()
          } catch {
            // ignore restart collision
          }
        }
      }

      recognition.start()
      setVoiceFeedback("Listening for 'Next', 'Back', or 'Ingredients'...")
    } catch {
      setVoiceFeedback('Failed to start voice recognition')
    }

    return () => {
      if (recognition) {
        recognition.onend = null
        try {
          recognition.stop()
        } catch {
          // ignore stop error
        }
      }
    }
  }, [isListening, totalSteps, currentStep, currentInstruction])

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const toggleVoiceCommands = () => {
    if (isListening) {
      setIsListening(false)
      setVoiceFeedback(null)
    } else {
      setIsListening(true)
    }
  }

  const readCurrentStep = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(currentInstruction)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleReadStep = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
    } else {
      readCurrentStep()
    }
  }

  const toggleIngredientCheck = (index: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-6 text-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-slate-900/90 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] h-auto my-auto overflow-hidden flex flex-col border border-slate-700/60 backdrop-blur-xl"
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Top Glass Header */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950/50 to-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-lg">
                🍳
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {recipe.recipeName}
                </h2>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 font-medium">
                  <span>Step {currentStep + 1} of {totalSteps}</span>
                  {recipe.prepTimeMinutes && (
                    <>
                      <span>•</span>
                      <span>⏱ Prep: {recipe.prepTimeMinutes}m</span>
                    </>
                  )}
                  {recipe.cookTimeMinutes && (
                    <>
                      <span>•</span>
                      <span>🔥 Cook: {recipe.cookTimeMinutes}m</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                onClick={toggleReadStep}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border cursor-pointer ${
                  isSpeaking
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 animate-pulse'
                    : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Read step out loud (Shortcut: R)"
              >
                <span>{isSpeaking ? '🔊' : '🔈'}</span>
                <span>{isSpeaking ? 'Stop Audio' : 'Read Step'}</span>
              </motion.button>

              <motion.button
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full p-2 transition-colors border border-transparent hover:border-slate-700"
                title="Close cooking mode (Esc)"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Interactive Step Track Bar */}
          <div className="bg-slate-950/80 border-b border-slate-800/80 px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto flex-shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {recipe.instructions.map((_, index) => {
                const isActive = index === currentStep
                const isPassed = index < currentStep
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentStep(index)
                      setShowIngredients(false)
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                        : isPassed
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>{isPassed ? '✓' : index + 1}</span>
                  </button>
                )
              })}
            </div>
            <span className="text-xs font-bold text-slate-400 flex-shrink-0 ml-2">
              {Math.round(progress)}% Complete
            </span>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4 sm:p-6 relative">
            <AnimatePresence mode="wait">
              {showIngredients ? (
                /* Full Ingredients Overlay */
                <motion.div
                  key="ingredients"
                  className="w-full h-full flex flex-col max-w-4xl py-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <span>🥗</span> Recipe Ingredients
                    </h3>
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                      {Object.values(checkedIngredients).filter(Boolean).length} / {recipe.ingredients.length} Ready
                    </span>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto flex-1 pr-2 max-h-[60vh]">
                    {recipe.ingredients.map((ingredient: string, index: number) => {
                      const isChecked = !!checkedIngredients[index]
                      return (
                        <motion.div
                          key={index}
                          onClick={() => toggleIngredientCheck(index)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-950/30 border-emerald-800/40 text-slate-400 opacity-60'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-100 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center border text-xs transition-all ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                                  : 'border-slate-600 bg-slate-900/60'
                              }`}
                            >
                              {isChecked && '✓'}
                            </div>
                            <span
                              className={`text-base sm:text-lg font-medium ${
                                isChecked ? 'line-through' : ''
                              }`}
                            >
                              {ingredient}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ) : (
                /* Split View: Mini Ingredients Sidebar + Main Instruction Card */
                <motion.div
                  key="instructions-split"
                  className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-4 sm:gap-6 max-w-6xl"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Left Side: Quick Ingredients Checklist Reference (hidden on mobile, visible on lg+) */}
                  <div className="hidden lg:flex flex-col w-72 bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 overflow-hidden flex-shrink-0">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span>🥗</span> Ingredients ({recipe.ingredients.length})
                      </span>
                    </div>

                    <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 max-h-[50vh] scrollbar-thin">
                      {recipe.ingredients.map((ingredient: string, index: number) => {
                        const isChecked = !!checkedIngredients[index]
                        return (
                          <div
                            key={index}
                            onClick={() => toggleIngredientCheck(index)}
                            className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-500 line-through'
                                : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border text-[10px] flex-shrink-0 ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                                  : 'border-slate-700 bg-slate-950'
                              }`}
                            >
                              {isChecked && '✓'}
                            </div>
                            <span className="leading-snug">{ingredient}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Navigation Controls + Instruction Card Container */}
                  <div className="flex-1 flex items-center justify-between gap-3 sm:gap-6 min-w-0">
                    {/* Previous Button */}
                    <motion.button
                      onClick={goToPreviousStep}
                      disabled={currentStep === 0}
                      className="flex-shrink-0 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg"
                      title="Previous step (Left Arrow)"
                      whileHover={{ scale: 1.08, x: -3 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>

                    {/* Main Instruction Display Card */}
                    <motion.div
                      key={currentStep}
                      className="flex-1 bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-3xl p-6 sm:p-10 border border-emerald-500/20 flex flex-col items-center justify-between overflow-hidden shadow-2xl relative min-h-[360px] max-h-[55vh]"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Top Step Badge & Timer */}
                      <div className="w-full flex items-center justify-between mb-3 flex-shrink-0">
                        <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                          Step {currentStep + 1}
                        </span>

                        {/* Built-in Step Timer Badge */}
                        {timerSeconds !== null && (
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => setIsTimerRunning((prev) => !prev)}
                              className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                isTimerRunning
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                                  : timerRemaining === 0
                                  ? 'bg-rose-500 text-white border-rose-400 animate-bounce'
                                  : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>⏱</span>
                              <span>
                                {timerRemaining === 0
                                  ? "Time's Up!"
                                  : isTimerRunning
                                  ? `Timer: ${formatTimerDisplay(timerRemaining ?? 0)} (Pause)`
                                  : `Start Timer (${formatTimerDisplay(timerRemaining ?? 0)})`}
                              </span>
                            </motion.button>

                            {timerRemaining !== timerSeconds && (
                              <button
                                onClick={() => {
                                  setTimerRemaining(timerSeconds)
                                  setIsTimerRunning(false)
                                }}
                                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                                title="Reset Timer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Instruction text with dynamic text scaling */}
                      <div className="flex-1 flex items-center justify-center my-3 overflow-y-auto w-full px-2 max-h-[35vh]">
                        <p className={getInstructionTextStyle(currentInstruction)}>
                          {currentInstruction}
                        </p>
                      </div>

                      {/* Footer helper note */}
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-3 flex-shrink-0 mt-2">
                        <span>Nav: <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">←</kbd> <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">→</kbd></span>
                        <span>•</span>
                        <span>Audio: <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">R</kbd></span>
                      </div>
                    </motion.div>

                    {/* Next Button */}
                    <motion.button
                      onClick={goToNextStep}
                      disabled={isLastStep}
                      className="flex-shrink-0 p-3.5 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 font-bold"
                      title={isLastStep ? "You've completed the recipe!" : "Next step (Right Arrow)"}
                      whileHover={{ scale: 1.08, x: 3 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Glass Footer Controls */}
          <div className="bg-slate-950/80 border-t border-slate-800 px-6 py-3 flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0">
            {/* Voice Control Pill */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={toggleVoiceCommands}
                className={`py-2 px-5 rounded-full font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Toggle Voice Commands (Shortcut: V)"
              >
                <span>🎤</span> {isListening ? 'Voice Commands Active' : 'Enable Voice (Shortcut: V)'}
              </motion.button>

              {isListening && voiceFeedback && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-2 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {voiceFeedback}
                </span>
              )}
            </div>

            {/* Toggle Full Ingredients / Steps Button */}
            <motion.button
              onClick={() => setShowIngredients(!showIngredients)}
              className="py-2 px-5 bg-slate-800 text-slate-100 border border-slate-700 rounded-full font-bold hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer text-xs"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Toggle Ingredients overlay (Shortcut: I)"
            >
              <span>{showIngredients ? '📋 View Steps' : '🥗 View Ingredients (Shortcut: I)'}</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CookingMode


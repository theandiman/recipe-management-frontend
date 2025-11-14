import React from 'react'

interface Step {
  number: number
  title: string
  icon: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  stepsWithErrors: Set<number>
  onStepClick: (step: number) => void
}

export const StepIndicator = React.memo<StepIndicatorProps>(({
  steps,
  currentStep,
  stepsWithErrors,
  onStepClick
}) => {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <button
            type="button"
            onClick={() => onStepClick(step.number)}
            className={`flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0 ${
              step.number === currentStep ? 'opacity-100' : step.number < currentStep ? 'opacity-100' : 'opacity-50'
            }`}
            aria-label={`Go to step ${step.number}: ${step.title}`}
          >
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold transition-colors relative ${
                step.number === currentStep
                  ? 'bg-green-600 text-white shadow-lg'
                  : step.number < currentStep
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-500'
              } ${
                stepsWithErrors.has(step.number) ? 'ring-2 ring-red-500 ring-offset-2' : ''
              }`}
            >
              {step.number < currentStep ? '✓' : step.icon}
              {stepsWithErrors.has(step.number) && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] sm:text-xs">!</span>
                </div>
              )}
            </div>
            <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
              step.number === currentStep ? 'text-gray-900' : stepsWithErrors.has(step.number) ? 'text-red-600' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
          </button>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-1 mx-2 rounded ${
              step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
})

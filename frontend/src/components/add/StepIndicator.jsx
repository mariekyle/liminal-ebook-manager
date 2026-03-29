/**
 * StepIndicator.jsx
 *
 * Reusable step indicator showing progress through multi-step flows.
 */

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center py-4 mb-6">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                  transition-all duration-200 ease-out
                  ${
                    isCompleted
                      ? 'bg-action-success text-text-primary'
                      : isActive
                        ? 'bg-action-primary text-text-primary'
                        : 'bg-transparent border-2 border-border-default text-text-muted'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckIcon />
                ) : (
                  <span className="sr-only">{index + 1}</span>
                )}
              </div>

              <span
                className={`
                  text-caption mt-1.5 transition-colors duration-200 ease-out
                  ${
                    isCompleted
                      ? 'text-action-success'
                      : isActive
                        ? 'text-text-primary'
                        : 'text-text-muted'
                  }
                `}
              >
                {label}
              </span>
            </div>

            {!isLast && (
              <div
                className={`
                  w-12 h-0.5 mx-2 transition-colors duration-200 ease-out
                  ${isCompleted ? 'bg-action-success' : 'bg-border-default'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3 h-3"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

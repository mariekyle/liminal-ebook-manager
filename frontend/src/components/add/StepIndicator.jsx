/**
 * StepIndicator.jsx
 * 
 * Reusable step indicator showing progress through multi-step flows.
 * 
 * Usage:
 *   <StepIndicator 
 *     steps={['Add', 'Review', 'Done']} 
 *     currentStep={1}  // 0-indexed
 *   />
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
            {/* Step dot and label */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                  transition-all duration-200
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-[#667eea] text-white' 
                      : 'bg-transparent border-2 border-gray-600 text-gray-600'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckIcon />
                ) : (
                  <span className="sr-only">{index + 1}</span>
                )}
              </div>
              
              {/* Label */}
              <span
                className={`
                  text-xs mt-1.5 transition-colors duration-200
                  ${isCompleted 
                    ? 'text-green-500' 
                    : isActive 
                      ? 'text-white' 
                      : 'text-gray-500'
                  }
                `}
              >
                {label}
              </span>
            </div>
            
            {/* Connector line */}
            {!isLast && (
              <div
                className={`
                  w-12 h-0.5 mx-2 transition-colors duration-200
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Small checkmark icon for completed steps
 */
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


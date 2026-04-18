export default function SegmentedControl({ value, onChange, options, size = 'md', ariaLabel, className = '' }) {
  const textSize = size === 'sm' ? 'text-[0.6875rem]' : 'text-body-sm'

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex items-center gap-1 bg-bg-surface rounded-lg p-1 min-h-[44px] ${className}`}
    >
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`flex-1 min-h-[40px] px-2 py-1.5 rounded-md ${textSize} transition-all duration-200 ease-out ${
              isActive
                ? 'bg-bg-elevated text-text-primary font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

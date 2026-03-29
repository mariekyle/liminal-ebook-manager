import { useState } from 'react'

/**
 * StarRating -- display or interactive star rating
 *
 * Props:
 *   value       - current rating (number or null)
 *   onChange     - callback when star is clicked (receives new value). Omit or pass null for read-only.
 *   max         - maximum stars (default 5)
 *   size        - 'sm' | 'md' | 'lg' (default 'md')
 *   disabled    - if true, stars are non-interactive and visually dimmed
 *   readOnly    - if true, no click handler, no hover states, no tap targets
 *   className   - additional classes on the wrapper
 */
const StarRating = ({
  value = null,
  onChange = null,
  max = 5,
  size = 'md',
  disabled = false,
  readOnly = false,
  className = '',
}) => {
  const [hovered, setHovered] = useState(null)

  const isInteractive = !readOnly && !disabled && typeof onChange === 'function'

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-3xl',
  }

  const handleClick = (star) => {
    if (!isInteractive) return
    // Toggle: clicking the current rating clears it
    onChange(value === star ? null : star)
  }

  const stars = []
  for (let i = 1; i <= max; i++) {
    const isFilled = i <= (hovered ?? value ?? 0)

    if (isInteractive) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleClick(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          className={`${sizeClasses[size]} transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isFilled
              ? 'text-action-warning hover:opacity-90'
              : 'text-text-muted hover:text-text-secondary'
          }`}
          aria-label={`Rate ${i} of ${max}`}
        >
          ★
        </button>,
      )
    } else {
      stars.push(
        <span
          key={i}
          className={`${sizeClasses[size]} ${
            isFilled ? 'text-action-warning' : 'text-text-muted'
          } ${disabled ? 'opacity-40' : ''}`}
        >
          ★
        </span>,
      )
    }
  }

  return (
    <div className={`flex items-center ${isInteractive ? 'gap-0' : 'gap-0.5'} ${className}`}>
      {stars}
    </div>
  )
}

export default StarRating

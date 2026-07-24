import { Link } from 'react-router-dom'

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-text-muted" aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

/**
 * SettingsRow — single row on the Settings page.
 *
 * Props:
 *   label          — primary label (required)
 *   description    — secondary line below label (optional)
 *   value          — string or ReactNode shown on the right (optional, display-only)
 *   type           — 'navigation' | 'toggle' | 'display'
 *                    'navigation' renders a tappable row with a → chevron; requires onClick OR to
 *                    'toggle' renders a toggle switch on the right; requires checked + onChange
 *                    'display' renders a non-tappable row with a value on the right
 *   onClick        — click handler for type='navigation' (opens modal, triggers action, etc.)
 *   to             — Link path for type='navigation' (renders a <Link> instead of <button>)
 *   checked        — toggle state for type='toggle'
 *   onChange       — toggle change handler for type='toggle', receives new boolean
 *   loading        — shows a subtle spinner on the right (replaces chevron)
 *   disabled       — disables the row
 *   destructive    — NOT USED in S7; reserved for future. Always false here.
 */
export default function SettingsRow({
  label,
  description,
  value,
  type = 'navigation',
  onClick,
  to,
  checked,
  onChange,
  loading = false,
  disabled = false,
}) {
  const content = (
    <>
      <div className="flex flex-col items-start text-left min-w-0 flex-1">
        <span className="text-body text-text-primary">{label}</span>
        {description && (
          <span className="text-body-sm text-text-muted mt-0.5">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        {value && (
          <span className="text-body-sm text-text-secondary text-right truncate max-w-[45vw]">
            {value}
          </span>
        )}
        {type === 'navigation' && !loading && <ChevronRightIcon />}
        {loading && (
          <svg viewBox="0 0 24 24" className="w-5 h-5 animate-spin text-text-muted" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        )}
      </div>
    </>
  )

  const baseClasses =
    'flex items-center w-full px-4 py-3 min-h-[56px] rounded-lg transition-colors duration-200 ease-out'
  const interactiveClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'hover:bg-bg-elevated active:bg-bg-elevated'

  if (type === 'toggle') {
    return (
      <div className={`${baseClasses}`}>
        <div className="flex flex-col items-start text-left min-w-0 flex-1">
          <span className="text-body text-text-primary">{label}</span>
          {description && (
            <span className="text-body-sm text-text-muted mt-0.5">{description}</span>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => onChange && onChange(!checked)}
          className={`
            relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ml-3
            ${checked ? 'bg-action-primary' : 'bg-bg-elevated border border-border-default'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${checked ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    )
  }

  if (type === 'display') {
    return <div className={baseClasses}>{content}</div>
  }

  // type === 'navigation'
  if (to && !disabled) {
    return (
      <Link to={to} className={`${baseClasses} ${interactiveClasses}`}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${interactiveClasses} text-left`}
    >
      {content}
    </button>
  )
}

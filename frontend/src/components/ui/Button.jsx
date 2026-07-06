/**
 * Button — Primary UI action component
 *
 * Variants: primary (muted teal), secondary, ghost, danger, success, warning
 * Sizes: sm (36px), md (44px), lg (48px)
 * States: loading, disabled
 *
 * Usage:
 *   <Button variant="primary" size="md" onClick={handleSave}>Save</Button>
 *   <Button variant="danger" loading>Deleting...</Button>
 *   <Button variant="ghost" icon={<ArrowDownIcon />}>Download</Button>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-[200ms] ease-out whitespace-nowrap select-none'

  const variantClasses = {
    primary: 'bg-action-primary text-text-primary hover:bg-action-primary-hover active:scale-[0.97]',
    secondary:
      'bg-action-secondary text-text-primary hover:bg-action-secondary-hover active:scale-[0.97]',
    ghost: 'bg-transparent text-text-secondary border border-border-default hover:bg-bg-elevated hover:text-text-primary active:scale-[0.97]',
    danger: 'bg-action-danger text-text-primary hover:bg-action-danger-hover active:scale-[0.97]',
    success: 'bg-action-success text-text-primary hover:bg-action-success-hover active:scale-[0.97]',
    // action-warning has no -hover token in config; /85 matches the former call-site override
    warning: 'bg-action-warning text-text-primary hover:bg-action-warning/85 active:scale-[0.97]',
  }

  const sizeClasses = {
    sm: 'text-[13px] px-3.5 py-2 min-h-[36px]',
    md: 'text-sm px-5 py-2.5 min-h-[44px]',
    lg: 'text-base px-7 py-3 min-h-[48px]',
  }

  const stateClasses = loading || disabled ? 'opacity-40 pointer-events-none' : ''
  // Loading gets slightly more opacity than disabled
  const loadingClasses = loading ? '!opacity-70' : ''

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses} ${loadingClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {!loading && icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}


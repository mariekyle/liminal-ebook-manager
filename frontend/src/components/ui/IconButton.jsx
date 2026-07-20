/**
 * IconButton — Icon-only interactive button
 *
 * Sizes: default (44px), sm (36px)
 * Variants: default (gray), accent (teal), muted (rest color drops to the muted text token)
 * Optional tooltip on hover
 *
 * Usage:
 *   <IconButton onClick={handleEdit} tooltip="Edit">
 *     <PencilIcon />
 *   </IconButton>
 *   <IconButton variant="accent" size="sm">
 *     <PlusIcon />
 *   </IconButton>
 */
export default function IconButton({
  children,
  variant = 'default',
  size = 'md',
  tooltip,
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center border-none rounded-lg bg-transparent cursor-pointer transition-all duration-[200ms] ease-out relative group'

  const variantClasses = {
    default: 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
    accent: 'text-action-primary hover:bg-action-primary/15',
    muted: 'text-text-muted hover:bg-bg-elevated hover:text-text-primary',
  }

  const sizeClasses = {
    sm: 'w-9 h-9 [&>svg]:w-4 [&>svg]:h-4',
    md: 'w-11 h-11 [&>svg]:w-5 [&>svg]:h-5',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} active:scale-[0.93] ${className}`}
      {...props}
    >
      {children}
      {tooltip && (
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[11px] text-text-primary bg-bg-elevated border border-border-default px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {tooltip}
        </span>
      )}
    </button>
  )
}


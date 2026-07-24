import { Link } from 'react-router-dom'

/**
 * MenuItem — one row inside a menu container (dropdown, bottom sheet,
 * context menu, popup).
 *
 * Owns item concerns ONLY: padding, tap height, danger color, disabled
 * dimming, the leading icon slot. Dividers, section headers, sheet
 * chrome, positioning, and backdrop/close behavior belong to the
 * container (ThreeDotMenu, BookContextMenu, etc.).
 *
 * Deliberately excluded (DESIGN_SYSTEM §3): trailing slot, submenus,
 * selected state, roving focus. If this component ever needs a
 * variant="sheet" prop, it has failed — containers style themselves.
 *
 * Usage:
 *   <MenuItem icon={<PencilIcon />} onClick={handleEdit}>Edit Collection</MenuItem>
 *   <MenuItem danger onClick={handleDelete}>Delete Collection</MenuItem>
 *   <MenuItem to={`/series/${id}`} onClick={closeMenu}>View Series</MenuItem>
 */
export default function MenuItem({
  children,
  icon,
  onClick,
  to,
  danger = false,
  disabled = false,
  className = '',
}) {
  const classes = `w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-surface transition-colors ${
    danger ? 'text-action-danger' : 'text-text-primary'
  } ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`

  const content = (
    <>
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </>
  )

  // A disabled item never navigates — it falls through to the dimmed,
  // inert button rendering below.
  if (to && !disabled) {
    return (
      <Link to={to} onClick={onClick} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  )
}

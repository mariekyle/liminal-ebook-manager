import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import MenuItem from './MenuItem'

/**
 * ThreeDotMenu — page-level overflow menu: 3-dot trigger + desktop
 * dropdown + portaled mobile bottom sheet. Extracted from BookDetail
 * in S4 (the ROADMAP 10.0.14 extraction, real at last).
 *
 * Controlled: the caller owns open state.
 *
 * Props:
 *   menuOpen, setMenuOpen — open state + setter
 *   menuItems — data-driven items array:
 *     { label, onClick, danger?, show?, icon? } — action row (show: false
 *       hides it; icon feeds MenuItem's leading slot)
 *     { type: 'divider' }                       — hairline row
 *   Item onClick handlers are responsible for closing the menu
 *   (call setMenuOpen(false) inside them).
 *
 * Items render via MenuItem in both containers; the sheet chrome
 * (handle, Cancel, backdrop) lives here. Containers are bg-bg-elevated
 * (ratified 2026-07-23 — one hover value everywhere: MenuItem's
 * bg-bg-surface).
 */
const ThreeDotMenu = ({
  menuOpen,
  setMenuOpen,
  menuItems
}) => {
  const menuRef = useRef(null)
  // The portaled mobile sheet lives outside menuRef's DOM subtree — without
  // this second containment check, a tap on any sheet item would count as
  // "outside" and close the menu on mousedown, before the item's click fires
  const sheetRef = useRef(null)

  // Close menu when clicking outside (desktop)
  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        !(sheetRef.current && sheetRef.current.contains(e.target))
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen, setMenuOpen])

  // Close menu on escape
  useEffect(() => {
    if (!menuOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuOpen, setMenuOpen])

  // Filter out items that shouldn't show
  const visibleItems = menuItems.filter(item => item.show !== false)

  return (
    <div className="relative" ref={menuRef}>
      {/* 3-dot button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="text-text-secondary hover:text-text-primary p-1.5 rounded hover:bg-bg-elevated transition-colors"
        aria-label="More actions"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {/* Desktop Dropdown */}
      {menuOpen && (
        <>
          {/* Desktop dropdown - hidden on mobile */}
          <div className="hidden md:block absolute right-0 top-full mt-1 w-56 bg-bg-elevated border border-border-default rounded-lg shadow-xl z-50 py-1 overflow-hidden">
            {visibleItems.map((item, idx) => (
              item.type === 'divider' ? (
                <div key={idx} className="border-t border-border-default my-1" />
              ) : (
                <MenuItem key={idx} onClick={item.onClick} danger={item.danger} icon={item.icon}>
                  {item.label}
                </MenuItem>
              )
            ))}
          </div>

          {/* Mobile Bottom Sheet — portaled to <body>: the sticky UnifiedNavBar
              wrapper (z-20) is a stacking context, so rendered in place the
              sheet's z-50 resolves inside it and paints under the z-40 bottom
              nav no matter how high its own z-index goes */}
          {createPortal(
          <div ref={sheetRef} className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-bg-overlay"
              onClick={() => setMenuOpen(false)}
            />

            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-bg-elevated rounded-t-2xl overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-border-default rounded-full" />
              </div>

              {/* Menu Items */}
              <div className="pb-2">
                {visibleItems.map((item, idx) => (
                  item.type === 'divider' ? (
                    <div key={idx} className="border-t border-border-default my-1" />
                  ) : (
                    <MenuItem key={idx} onClick={item.onClick} danger={item.danger} icon={item.icon}>
                      {item.label}
                    </MenuItem>
                  )
                ))}
              </div>

              {/* Cancel Button */}
              <div className="px-2 pb-6 pt-2 border-t border-border-default">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full py-3.5 text-base font-medium text-text-secondary hover:bg-bg-surface rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
          )}
        </>
      )}
    </div>
  )
}

export default ThreeDotMenu

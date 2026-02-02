import { Link } from 'react-router-dom'

/**
 * UnifiedNavBar - Contextual navigation for detail pages
 * 
 * Variants:
 * - Back link + right content (default): backLabel + backTo + children
 * - Back button with callback: backLabel + onBack + children
 * - Title only: title prop (no back link)
 */
export default function UnifiedNavBar({ 
  backLabel,    // e.g., "Library", "Series"
  backTo,       // e.g., "/", "/series" (used with Link)
  onBack,       // Optional: callback function (used instead of Link)
  title,        // For title-only variant (e.g., "Settings")
  children      // Right side content (e.g., 3-dot menu)
}) {
  // Title-only variant (for Settings)
  if (title) {
    return (
      <div className="sticky top-0 z-20 bg-library-bg border-b border-gray-700">
        <div className="px-4 md:px-8 py-4">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>
      </div>
    )
  }

  // Back content (shared between link and button variants)
  const backContent = (
    <>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {backLabel}
    </>
  )

  // Back link/button variant (for detail pages)
  return (
    <div className="sticky top-0 z-20 bg-library-bg border-b border-gray-700">
      <div className="flex justify-between items-center px-4 md:px-8 py-3">
        {/* Back - render as button if onBack provided, otherwise as Link */}
        {onBack ? (
          <button 
            onClick={onBack}
            className="flex items-center gap-1 text-library-accent text-sm hover:underline"
          >
            {backContent}
          </button>
        ) : (
          <Link 
            to={backTo}
            className="flex items-center gap-1 text-library-accent text-sm hover:underline"
          >
            {backContent}
          </Link>
        )}

        {/* Right side content (menu, etc.) */}
        {children && (
          <div className="flex items-center gap-1">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

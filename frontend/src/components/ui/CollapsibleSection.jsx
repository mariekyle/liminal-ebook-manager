/**
 * CollapsibleSection - Expandable content area with gradient fade
 * 
 * Features:
 * - Collapsed by default (3 lines for text, ~2 rows for tags)
 * - Gradient fade at bottom when collapsed
 * - "View more" / "View less" toggle
 * - Smart: hides toggle if content fits without truncation
 * - No animation (instant expand/collapse)
 * - State resets on unmount (no persistence)
 * 
 * Variants:
 * - text: For paragraph content (About This Book)
 * - tags: For tag chips (Tags section)
 * - grid: For key-value pairs (Metadata)
 */
import { useState, useRef, useEffect } from 'react'

export default function CollapsibleSection({
  title,
  children,
  variant = 'text',        // 'text' | 'tags' | 'grid'
  count = null,            // For tags: total count to display
  collapsedHeight = null,  // Override default collapsed height
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsCollapse, setNeedsCollapse] = useState(false)
  const contentRef = useRef(null)

  // Default collapsed heights by variant
  const defaultHeights = {
    text: 72,    // ~3 lines at 1.5 line-height
    tags: 72,    // ~2 rows of tags
    grid: 72     // ~3 key-value pairs
  }

  const maxHeight = collapsedHeight || defaultHeights[variant] || 72

  // Check if content needs collapsing
  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight
      setNeedsCollapse(contentHeight > maxHeight + 8) // 8px buffer
    }
  }, [children, maxHeight])

  // Toggle text based on variant and count
  const getToggleText = () => {
    if (isExpanded) return 'View less'
    if (variant === 'tags' && count) return `View all ${count} tags`
    return 'View more'
  }

  return (
    <div className={`border-t border-white/5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
        {variant === 'tags' && count && (
          <span className="text-xs text-gray-500">{count} tags</span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <div className="relative">
          {/* Content wrapper with conditional max-height */}
          <div
            ref={contentRef}
            className="overflow-hidden transition-none"
            style={{
              maxHeight: !isExpanded && needsCollapse ? `${maxHeight}px` : 'none'
            }}
          >
            {children}
          </div>

          {/* Gradient fade overlay when collapsed */}
          {!isExpanded && needsCollapse && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
              style={{
                background: 'linear-gradient(transparent, rgb(26, 26, 31))'
              }}
            />
          )}
        </div>

        {/* Toggle button - only show if content needs collapsing */}
        {needsCollapse && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-teal-400 text-sm mt-2 hover:underline focus:outline-none"
          >
            {getToggleText()}
          </button>
        )}
      </div>
    </div>
  )
}

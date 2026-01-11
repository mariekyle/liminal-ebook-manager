import { useState, useEffect, useRef } from 'react'
import { getCoverUrl } from '../api'

/**
 * GradientCover - Displays book cover with priority: custom > extracted > gradient
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Graceful fallback to gradient on error
 * - Loading placeholder
 * - Multiple size variants
 * - Optional text overlay for title/author (disabled by default)
 * - Backward compatibility with legacy props
 * 
 * Size behavior:
 * - No size prop: Uses w-full with aspect-[2/3] (fills parent width, auto height)
 * - size="fill": Uses w-full h-full (requires parent with explicit height)
 * - size="xs/sm/default/md/lg/xl": Fixed pixel dimensions
 */

const sizeClasses = {
  xs: 'w-12 h-16',        // 48x64 - tiny thumbnails
  sm: 'w-16 h-24',        // 64x96 - small cards
  default: 'w-24 h-36',   // 96x144 - standard cards
  md: 'w-32 h-48',        // 128x192 - medium display
  lg: 'w-48 h-72',        // 192x288 - detail page
  xl: 'w-64 h-96',        // 256x384 - hero display
  fill: 'w-full h-full',  // Fill parent container (parent must have explicit height)
}

export default function GradientCover({ 
  book: bookProp, 
  size,  // undefined = use aspect ratio, 'fill' = fill parent, others = fixed size
  className = '',
  showTitle = false,  // OFF by default - callers typically show title separately
  showAuthor = false, // OFF by default - callers typically show author separately
  // Legacy props for backward compatibility (used by BookCard, AuthorDetail, etc.)
  title,
  author,
  coverGradient,
  coverBgColor,
  coverTextColor,
  id
}) {
  // Normalize author prop - handle both string and array inputs
  const normalizeAuthor = (authorInput) => {
    if (!authorInput) return ''
    if (typeof authorInput === 'string') return authorInput
    if (Array.isArray(authorInput)) {
      // Handle nested arrays (e.g., [[author1, author2]])
      const first = authorInput[0]
      if (Array.isArray(first)) return first[0] || ''
      return first || ''
    }
    return String(authorInput)
  }
  
  const normalizedAuthor = normalizeAuthor(author)
  
  // Build book object from legacy props if book prop not provided
  const book = bookProp || {
    id: id,
    title: title,
    author: normalizedAuthor,
    authors: Array.isArray(author) ? author.flat() : (author ? [author] : []),
    cover_gradient: coverGradient,
    coverGradient: coverGradient,
    cover_color_1: coverBgColor,
    coverBgColor: coverBgColor,
    cover_color_2: coverTextColor,
    coverTextColor: coverTextColor,
    has_cover: false,
    cover_path: null
  }

  const [imageState, setImageState] = useState('idle') // 'idle' | 'loading' | 'loaded' | 'error'
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef(null)
  
  // Determine if book has a real cover
  const hasRealCover = book?.has_cover && book?.cover_path
  
  // Get display title and author (handle arrays properly)
  const displayTitle = book?.title || title || ''
  const displayAuthor = normalizeAuthor(book?.author) || normalizeAuthor(book?.authors) || normalizedAuthor
  
  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (!hasRealCover) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' } // Start loading 100px before visible
    )
    
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    
    return () => observer.disconnect()
  }, [hasRealCover])
  
  // Load image when visible
  useEffect(() => {
    if (!isVisible || !hasRealCover || !book?.id) return
    
    setImageState('loading')
    
    const img = new Image()
    img.onload = () => setImageState('loaded')
    img.onerror = () => setImageState('error')
    img.src = getCoverUrl(book.id)
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [isVisible, hasRealCover, book?.id])
  
  // Get gradient colors with fallbacks
  const color1 = book?.cover_color_1 || book?.coverBgColor || '#4a5568'
  const color2 = book?.cover_color_2 || book?.coverTextColor || '#2d3748'
  
  // Support both old props (coverGradient) and new book object
  const gradient = book?.cover_gradient || book?.coverGradient
  
  // Determine container classes based on size prop
  // - undefined: Use aspect ratio (works in any parent)
  // - 'fill': Fill parent (parent must have explicit height)
  // - other: Fixed pixel dimensions
  const sizeClass = size 
    ? (sizeClasses[size] || sizeClasses.default)
    : 'w-full aspect-[2/3]'  // Default: fill width, maintain 2:3 aspect ratio
  
  const containerClasses = `
    ${sizeClass}
    ${className}
    relative overflow-hidden rounded-lg
  `.trim()
  
  // Text overlay component - only rendered when showTitle or showAuthor is true
  const TextOverlay = () => {
    if (!showTitle && !showAuthor) return null
    if (!displayTitle && !displayAuthor) return null
    
    return (
      <div className="absolute inset-0 flex flex-col justify-end p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
        {showTitle && displayTitle && (
          <p className="text-white text-xs font-medium leading-tight line-clamp-2 drop-shadow-md">
            {displayTitle}
          </p>
        )}
        {showAuthor && displayAuthor && (
          <p className="text-gray-300 text-xs leading-tight truncate drop-shadow-md mt-0.5">
            {displayAuthor}
          </p>
        )}
      </div>
    )
  }
  
  // Show real cover if loaded successfully
  if (hasRealCover && imageState === 'loaded') {
    return (
      <div ref={containerRef} className={containerClasses}>
        <img
          src={getCoverUrl(book.id)}
          alt={displayTitle || 'Book cover'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <TextOverlay />
      </div>
    )
  }
  
  // Show loading state while image loads
  if (hasRealCover && (imageState === 'idle' || imageState === 'loading')) {
    return (
      <div ref={containerRef} className={containerClasses}>
        <div 
          className="w-full h-full animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${color1}40, ${color2}40)`
          }}
        />
      </div>
    )
  }
  
  // Gradient fallback (no cover or error loading)
  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: gradient || `linear-gradient(135deg, ${color1}, ${color2})`
        }}
      />
      
      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)'
        }}
      />
      
      {/* Text overlay - only if explicitly enabled */}
      <TextOverlay />
      
      {/* Cover source indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && imageState === 'error' && (
        <div className="absolute top-1 right-1 bg-red-500/50 text-white text-xs px-1 rounded">
          err
        </div>
      )}
    </div>
  )
}

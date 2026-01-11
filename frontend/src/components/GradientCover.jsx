import { useState, useEffect, useRef } from 'react'
import { getCoverUrl } from '../api'

/**
 * GradientCover - Displays book cover with priority: custom > extracted > gradient
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Graceful fallback to gradient on error
 * - Loading placeholder
 * - Multiple size variants using aspect-ratio for proper book proportions
 * - Text overlay for title/author
 * - Backward compatibility with legacy props
 */

const sizeClasses = {
  // 'fill' requires parent to have explicit dimensions
  fill: 'w-full h-full',
  // All other sizes use aspect-ratio for book cover proportions (2:3)
  xs: 'w-12 aspect-[2/3]',        // 48px wide, height from aspect ratio
  sm: 'w-16 aspect-[2/3]',        // 64px wide
  default: 'w-full aspect-[2/3]', // Full width of parent, height from aspect ratio
  md: 'w-32 aspect-[2/3]',        // 128px wide
  lg: 'w-48 aspect-[2/3]',        // 192px wide
  xl: 'w-64 aspect-[2/3]',        // 256px wide
}

export default function GradientCover({ 
  book: bookProp, 
  size = 'default',  // FIXED: Changed from 'fill' to 'default' - uses aspect ratio
  className = '',
  showTitle = true,  // Show title by default (restored original behavior)
  showAuthor = true, // Show author by default (restored original behavior)
  // Legacy props for backward compatibility (used by BookCard, AuthorDetail, etc.)
  title,
  author,
  coverGradient,
  coverBgColor,
  coverTextColor,
  id
}) {
  // Build book object from legacy props if book prop not provided
  const book = bookProp || {
    id: id,
    title: title,
    author: author,
    authors: author ? [author] : [],
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
  
  // Get display title and author
  const displayTitle = book?.title || title || ''
  const displayAuthor = book?.author || (book?.authors && book.authors.length > 0 ? book.authors[0] : '') || author || ''
  
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
  
  // Get gradient colors with fallbacks (check all possible field names)
  const color1 = book?.cover_color_1 || book?.cover_bg_color || book?.coverBgColor || '#4a5568'
  const color2 = book?.cover_color_2 || book?.cover_text_color || book?.coverTextColor || '#2d3748'
  
  // Support both old props (coverGradient) and new book object
  const gradient = book?.cover_gradient || book?.coverGradient
  
  const containerClasses = `
    ${sizeClasses[size] || sizeClasses.default}
    ${className}
    relative overflow-hidden rounded-lg
  `.trim()
  
  // Text overlay component - used for both real covers and gradients
  // Layout: Title centered vertically, Author at bottom, both horizontally centered
  const TextOverlay = () => {
    if (!showTitle && !showAuthor) return null
    if (!displayTitle && !displayAuthor) return null
    
    return (
      <div className="absolute inset-0 flex flex-col">
        {/* Title - centered vertically and horizontally */}
        {showTitle && displayTitle && (
          <div className="flex-1 flex items-center justify-center px-3">
            <p 
              className="text-white text-center line-clamp-3 drop-shadow-lg"
              style={{ 
                fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                fontSize: '.875rem',
                fontWeight: 700,
                lineHeight: '.875rem'
              }}
            >
              {displayTitle}
            </p>
          </div>
        )}
        
        {/* Author - at bottom, centered horizontally */}
        {showAuthor && displayAuthor && (
          <div className="pb-3 px-3">
            <p className="text-gray-300 text-xs leading-tight text-center truncate drop-shadow-lg">
              {displayAuthor}
            </p>
          </div>
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
      
      {/* Text overlay */}
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

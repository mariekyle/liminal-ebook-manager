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
 * - Backward compatibility with legacy props
 */

const sizeClasses = {
  xs: 'w-12 h-16',      // 48x64 - tiny thumbnails
  sm: 'w-16 h-24',      // 64x96 - small cards
  default: 'w-24 h-36', // 96x144 - standard cards
  md: 'w-32 h-48',      // 128x192 - medium display
  lg: 'w-48 h-72',      // 192x288 - detail page
  xl: 'w-64 h-96',      // 256x384 - hero display
}

export default function GradientCover({ 
  book: bookProp, 
  size = 'default',
  className = '',
  showTitle = false,
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
  
  const containerClasses = `
    ${sizeClasses[size] || sizeClasses.default}
    ${className}
    relative overflow-hidden rounded-lg
  `.trim()
  
  // Show real cover if loaded successfully
  if (hasRealCover && imageState === 'loaded') {
    return (
      <div ref={containerRef} className={containerClasses}>
        <img
          src={getCoverUrl(book.id)}
          alt={book.title || 'Book cover'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {showTitle && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-white text-xs font-medium truncate">{book.title}</p>
          </div>
        )}
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
      
      {/* Title text (if enabled) */}
      {showTitle && book?.title && (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <p className="text-white text-center text-sm font-medium line-clamp-3 drop-shadow-lg">
            {book.title}
          </p>
        </div>
      )}
      
      {/* Cover source indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && imageState === 'error' && (
        <div className="absolute top-1 right-1 bg-red-500/50 text-white text-xs px-1 rounded">
          err
        </div>
      )}
    </div>
  )
}

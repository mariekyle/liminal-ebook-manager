import { Link } from 'react-router-dom'
import GradientCover from './GradientCover'

function BookCard({ 
  book, 
  showActivityBar = false, 
  showTitleBelow = false, 
  showAuthorBelow = false, 
  showSeriesBelow = false,
  isChecklistCompleted = false  // Phase 9E: For checklist collections
}) {
  const primaryAuthor = book.authors?.[0] || 'Unknown Author'
  
  // Format series display
  const seriesDisplay = book.series && book.series_number
    ? `${book.series} #${book.series_number}`
    : null
  
  // Check if this is a wishlist item
  const isWishlist = book.acquisition_status === 'wishlist'

  return (
    <Link 
      to={`/book/${book.id}`}
      state={{ returnUrl: window.location.pathname + window.location.search }}
      className="group block"
    >
      {/* Wrapper div for checklist opacity */}
      <div className={isChecklistCompleted ? 'opacity-50' : ''}>
        <div className="relative">
          {/* Cover - pass book object with cover fields (Phase 9C fix) */}
          {/* FIXED: Removed size="fill" - default uses aspect-[2/3] which self-determines height */}
          <GradientCover
            book={{
              id: book.id,
              title: book.title,
              author: primaryAuthor,
              // Cover image fields (Phase 9C)
              has_cover: book.has_cover || false,
              cover_path: book.cover_path || null,
              cover_source: book.cover_source || null,
              // Gradient fallback fields - include all possible field names
              cover_gradient: book.cover_gradient,
              cover_color_1: book.cover_color_1,
              cover_color_2: book.cover_color_2,
              cover_bg_color: book.cover_bg_color,
              cover_text_color: book.cover_text_color,
            }}
            showTitle={true}
            showAuthor={true}
            className={isWishlist ? 'border-2 border-dashed border-gray-500' : ''}
          />
          
          {/* Activity bar for in-progress books */}
          {showActivityBar && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
              <div className="h-full w-1/2 bg-library-accent" />
            </div>
          )}
          
          {/* Checklist completed indicator - takes priority over other indicators */}
          {isChecklistCompleted ? (
            <div 
              className="absolute top-2 right-2 w-6 h-6 bg-emerald-600/90 rounded flex items-center justify-center"
              title="Completed"
            >
              <svg 
                className="w-4 h-4 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          ) : (
            <>
              {/* Finished indicator - only show for owned books */}
              {!isWishlist && book.status === 'Finished' && (
                <div 
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded flex items-center justify-center"
                  title="Finished"
                >
                  <svg 
                    className="w-4 h-4 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2.5} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              )}
              
              {/* Wishlist indicator */}
              {isWishlist && (
                <div 
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded flex items-center justify-center"
                  title="Wishlist"
                >
                  <svg 
                    className="w-4 h-4 text-gray-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                    />
                  </svg>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Info - conditionally show each element */}
        {(showTitleBelow || showAuthorBelow || showSeriesBelow) && (
          <div className="mt-2 px-1">
            {showTitleBelow && (
              <h3 className="text-white text-sm font-medium truncate group-hover:text-library-accent transition-colors">
                {book.title}
              </h3>
            )}
            {showAuthorBelow && (
              <p className="text-gray-400 text-xs truncate">
                {primaryAuthor}
              </p>
            )}
            {showSeriesBelow && seriesDisplay && (
              <p className="text-gray-500 text-xs truncate">
                {seriesDisplay}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default BookCard

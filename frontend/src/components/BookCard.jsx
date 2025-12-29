import { Link } from 'react-router-dom'
import GradientCover from './GradientCover'

function BookCard({ book }) {
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
      <div className="relative">
        {/* Cover - add dotted border for wishlist items */}
        <GradientCover
          title={book.title}
          author={primaryAuthor}
          coverGradient={book.cover_gradient}
          coverBgColor={book.cover_bg_color}
          coverTextColor={book.cover_text_color}
          className={isWishlist ? 'border-2 border-dashed border-gray-500' : ''}
        />
        
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
      </div>
      
      {/* Info */}
      <div className="mt-2 px-1">
        <h3 className="text-white text-sm font-medium truncate group-hover:text-library-accent transition-colors">
          {book.title}
        </h3>
        <p className="text-gray-400 text-xs truncate">
          {primaryAuthor}
        </p>
        {seriesDisplay && (
          <p className="text-gray-500 text-xs truncate">
            {seriesDisplay}
          </p>
        )}
      </div>
    </Link>
  )
}

export default BookCard

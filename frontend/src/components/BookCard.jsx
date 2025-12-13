import { Link } from 'react-router-dom'
import GradientCover from './GradientCover'

function BookCard({ book }) {
  const primaryAuthor = book.authors?.[0] || 'Unknown Author'
  
  // Format series display
  const seriesDisplay = book.series && book.series_number
    ? `${book.series} #${book.series_number}`
    : null

  return (
    <Link 
      to={`/book/${book.id}`}
      className="group block"
    >
      <div className="relative">
        {/* Cover */}
        <GradientCover
          title={book.title}
          author={primaryAuthor}
          color1={book.cover_color_1}
          color2={book.cover_color_2}
        />
        
        {/* Has Notes Indicator */}
        {book.has_notes && (
          <div 
            className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded font-medium"
            title="Has notes"
          >
            📝
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
// test auto-deploy

import { Link } from 'react-router-dom'

function SeriesCard({ series }) {
  // Use provided gradient or fallback
  const gradient = series.cover_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  const bgColor = series.cover_bg_color || '#667eea'
  const textColor = series.cover_text_color || '#fff'
  
  // Truncate long series names
  const displayName = series.name.length > 40 
    ? series.name.slice(0, 37) + '...' 
    : series.name

  return (
    <Link 
      to={`/series/${encodeURIComponent(series.name)}`}
      className="group block"
    >
      {/* Square Cover */}
      <div 
        className="relative aspect-square rounded-lg overflow-hidden"
        style={{
          backgroundImage: gradient,
          backgroundColor: bgColor,
        }}
      >
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <h3 
            className="text-center font-serif font-bold text-sm sm:text-base leading-tight mb-2"
            style={{ 
              color: textColor,
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)' 
            }}
          >
            {displayName}
          </h3>
          <p 
            className="text-center text-xs"
            style={{ 
              color: textColor,
              opacity: 0.7,
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' 
            }}
          >
            {series.book_count} {series.book_count === 1 ? 'book' : 'books'}
          </p>
        </div>
        
        {/* Subtle texture overlay */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }}
        />
      </div>
      
      {/* Author below cover */}
      <div className="mt-2 px-1">
        <p className="text-gray-400 text-xs truncate">
          {series.author}
        </p>
      </div>
    </Link>
  )
}

export default SeriesCard

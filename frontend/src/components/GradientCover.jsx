/**
 * GradientCover Component
 * 
 * Renders a book cover with gradient background.
 * Colors are either passed as props (from database) or generated from title/author.
 * 
 * This matches the visual style from the Obsidian plugin's gradient cover system.
 */

function GradientCover({ 
  title, 
  author, 
  color1, 
  color2, 
  className = '' 
}) {
  // Use provided colors or generate defaults
  const gradientColor1 = color1 || '#667eea'
  const gradientColor2 = color2 || '#764ba2'
  
  // Truncate long titles for display on cover
  const displayTitle = title.length > 50 
    ? title.slice(0, 47) + '...' 
    : title
  
  const displayAuthor = author.length > 30 
    ? author.slice(0, 27) + '...' 
    : author

  return (
    <div 
      className={`cover-gradient relative aspect-[2/3] rounded-lg overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`
      }}
    >
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-3">
        {/* Title area */}
        <div className="flex-1 flex items-center justify-center">
          <h3 
            className="text-white text-center font-serif font-bold text-sm sm:text-base leading-tight px-2"
            style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)' }}
          >
            {displayTitle}
          </h3>
        </div>
        
        {/* Author */}
        <p 
          className="text-white/70 text-center text-xs truncate"
          style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}
        >
          {displayAuthor}
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
  )
}

export default GradientCover

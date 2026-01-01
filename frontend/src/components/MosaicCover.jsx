/**
 * MosaicCover - 2x2 grid of mini gradient covers for collections
 * 
 * Shows up to 4 book gradients in a mosaic pattern.
 * Falls back to placeholder gradient if fewer than 2 books.
 */

export default function MosaicCover({ books = [], className = '' }) {
  // If fewer than 2 books, show a placeholder gradient
  if (!books || books.length < 2) {
    return (
      <div className={`aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center ${className}`}>
        <span className="text-white/60 text-4xl">📚</span>
      </div>
    )
  }
  
  // Get up to 4 books for the mosaic
  const mosaicBooks = books.slice(0, 4)
  
  // Pad to 4 if we have 2-3 books
  while (mosaicBooks.length < 4) {
    mosaicBooks.push(null)
  }
  
  // Generate gradient from cover colors
  const getGradient = (book) => {
    if (!book) return 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
    const c1 = book.cover_color_1 || '#667eea'
    const c2 = book.cover_color_2 || '#764ba2'
    return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
  }
  
  return (
    <div className={`aspect-[2/3] rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 gap-0.5 bg-gray-800 ${className}`}>
      {mosaicBooks.map((book, index) => (
        <div 
          key={index} 
          className="relative overflow-hidden"
          style={{ backgroundImage: getGradient(book) }}
        />
      ))}
    </div>
  )
}


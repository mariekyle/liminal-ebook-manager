/**
 * CollectionCover - Collection cover display
 * 
 * Supports:
 * - gradient: Purple-pink gradient with list icon (default)
 * - custom: User-uploaded image
 * 
 * Props:
 * - coverType: 'gradient' or 'custom'
 * - collectionId: Collection ID (required for custom covers)
 * - className: Additional CSS classes
 * - variant: 'card' (2:3 aspect), 'square' (1:1), or 'banner' (cropped header)
 */

export default function CollectionCover({ 
  coverType = 'gradient',
  collectionId = null,
  className = '',
  variant = 'card'
}) {
  const ListIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-white/60">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )

  // Square variant - for collection grid cards
  if (variant === 'square') {
    if (coverType === 'custom' && collectionId) {
      return (
        <div className={`aspect-square rounded-lg overflow-hidden ${className}`}>
          <img 
            src={`/api/collections/${collectionId}/cover`}
            alt="Collection cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.classList.add('bg-gradient-to-br', 'from-purple-600', 'to-pink-500', 'flex', 'items-center', 'justify-center')
            }}
          />
        </div>
      )
    }
    
    // Gradient square
    return (
      <div className={`aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center ${className}`}>
        <ListIcon />
      </div>
    )
  }

  // Banner variant - cropped header style
  if (variant === 'banner') {
    if (coverType === 'custom' && collectionId) {
      return (
        <div className={`w-full h-48 md:h-56 rounded-lg overflow-hidden ${className}`}>
          <img 
            src={`/api/collections/${collectionId}/cover`}
            alt="Collection cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.classList.add('bg-gradient-to-br', 'from-purple-600', 'to-pink-500', 'flex', 'items-center', 'justify-center')
            }}
          />
        </div>
      )
    }
    
    // Gradient banner
    return (
      <div className={`w-full h-48 md:h-56 rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center ${className}`}>
        <ListIcon />
      </div>
    )
  }

  // Card variant (default) - 2:3 aspect ratio for grid
  if (coverType === 'custom' && collectionId) {
    return (
      <div className={`aspect-[2/3] rounded-lg overflow-hidden ${className}`}>
        <img 
          src={`/api/collections/${collectionId}/cover`}
          alt="Collection cover"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.parentElement.classList.add('bg-gradient-to-br', 'from-purple-600', 'to-pink-500', 'flex', 'items-center', 'justify-center')
          }}
        />
      </div>
    )
  }
  
  // Gradient card (default)
  return (
    <div className={`aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center ${className}`}>
      <ListIcon />
    </div>
  )
}

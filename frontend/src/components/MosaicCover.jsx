/**
 * MosaicCover - Collection cover display
 * 
 * Supports:
 * - gradient: Deterministic gradient based on collection name/ID (no icon)
 * - custom: User-uploaded image
 * 
 * Props:
 * - coverType: 'gradient' or 'custom'
 * - collectionId: Collection ID (required for custom covers and gradient generation)
 * - collectionName: Collection name (used for gradient generation)
 * - className: Additional CSS classes
 * - variant: 'card' (2:3 aspect), 'square' (1:1), or 'banner' (cropped header)
 */

import CollectionGradient from './CollectionGradient'

export default function MosaicCover({ 
  coverType = 'gradient',
  collectionId = null,
  collectionName = '',
  className = '',
  variant = 'card'
}) {
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
              // Hide broken image and show gradient fallback
              e.target.style.display = 'none'
              e.target.nextSibling?.classList.remove('hidden')
            }}
          />
          <div className="hidden w-full h-full">
            <CollectionGradient 
              collectionId={collectionId} 
              collectionName={collectionName}
              className="rounded-lg"
            />
          </div>
        </div>
      )
    }
    
    // Gradient square - use CollectionGradient (no icon)
    return (
      <div className={`aspect-square rounded-lg overflow-hidden ${className}`}>
        <CollectionGradient 
          collectionId={collectionId} 
          collectionName={collectionName}
        />
      </div>
    )
  }

  // Banner variant - cropped header style (taller for visual impact)
  if (variant === 'banner') {
    if (coverType === 'custom' && collectionId) {
      return (
        <div className={`w-full h-96 md:h-[28rem] rounded-lg overflow-hidden ${className}`}>
          <img 
            src={`/api/collections/${collectionId}/cover`}
            alt="Collection cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image and show gradient fallback
              e.target.style.display = 'none'
              e.target.nextSibling?.classList.remove('hidden')
            }}
          />
          <div className="hidden w-full h-full">
            <CollectionGradient 
              collectionId={collectionId} 
              collectionName={collectionName}
            />
          </div>
        </div>
      )
    }
    
    // Gradient banner - use CollectionGradient (no icon)
    return (
      <div className={`w-full h-96 md:h-[28rem] rounded-lg overflow-hidden ${className}`}>
        <CollectionGradient 
          collectionId={collectionId} 
          collectionName={collectionName}
        />
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
            // Hide broken image and show gradient fallback
            e.target.style.display = 'none'
            e.target.nextSibling?.classList.remove('hidden')
          }}
        />
        <div className="hidden w-full h-full">
          <CollectionGradient 
            collectionId={collectionId} 
            collectionName={collectionName}
            className="rounded-lg"
          />
        </div>
      </div>
    )
  }
  
  // Gradient card (default) - use CollectionGradient (no icon)
  return (
    <div className={`aspect-[2/3] rounded-lg overflow-hidden ${className}`}>
      <CollectionGradient 
        collectionId={collectionId} 
        collectionName={collectionName}
      />
    </div>
  )
}

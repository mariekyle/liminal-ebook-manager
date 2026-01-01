/**
 * CollectionCard - Display card for a collection in the grid
 */

import { useNavigate } from 'react-router-dom'
import MosaicCover from './MosaicCover'

export default function CollectionCard({ collection }) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate(`/collections/${collection.id}`)
  }
  
  return (
    <button
      onClick={handleClick}
      className="text-left w-full group"
    >
      {/* Cover */}
      <div className="relative rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
        <MosaicCover books={collection.preview_books || []} />
      </div>
      
      {/* Info */}
      <div className="mt-2 px-0.5">
        <h3 className="font-medium text-gray-100 truncate group-hover:text-white transition-colors">
          {collection.name}
        </h3>
        <p className="text-sm text-gray-400">
          {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
        </p>
      </div>
    </button>
  )
}


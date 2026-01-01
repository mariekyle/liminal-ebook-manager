/**
 * CollectionDetail - View a collection with all its books
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCollection, deleteCollection, removeBookFromCollection, updateCollection, uploadCollectionCover, updateCollectionCoverType, deleteCollectionCover } from '../api'
import BookCard from './BookCard'
import CollectionModal from './CollectionModal'
import MosaicCover from './MosaicCover'

// Icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const DotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export default function CollectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [removeMode, setRemoveMode] = useState(false)
  const [showCoverOptions, setShowCoverOptions] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  
  const fetchCollection = async () => {
    try {
      setLoading(true)
      const data = await getCollection(id)
      setCollection(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch collection:', err)
      setError('Collection not found')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchCollection()
  }, [id])
  
  const handleDelete = async () => {
    try {
      await deleteCollection(id)
      navigate('/collections')
    } catch (err) {
      console.error('Failed to delete collection:', err)
      alert('Failed to delete collection')
    }
  }
  
  const handleCoverTypeChange = async (type) => {
    try {
      await updateCollectionCoverType(id, type)
      setCollection(prev => ({ ...prev, cover_type: type }))
      setShowCoverOptions(false)
    } catch (err) {
      console.error('Failed to update cover type:', err)
      alert('Failed to update cover type')
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }
    
    try {
      setUploadingCover(true)
      const result = await uploadCollectionCover(id, file)
      setCollection(prev => ({ 
        ...prev, 
        cover_type: 'custom',
        custom_cover_path: result.custom_cover_path 
      }))
      setShowCoverOptions(false)
    } catch (err) {
      console.error('Failed to upload cover:', err)
      alert('Failed to upload cover')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleDeleteCover = async () => {
    try {
      await deleteCollectionCover(id)
      setCollection(prev => ({ 
        ...prev, 
        cover_type: 'mosaic',
        custom_cover_path: null 
      }))
      setShowCoverOptions(false)
    } catch (err) {
      console.error('Failed to delete cover:', err)
      alert('Failed to delete cover')
    }
  }
  
  const handleRemoveBook = async (titleId) => {
    try {
      await removeBookFromCollection(id, titleId)
      // Update local state
      setCollection(prev => ({
        ...prev,
        books: prev.books.filter(b => b.id !== titleId),
        book_count: prev.book_count - 1
      }))
    } catch (err) {
      console.error('Failed to remove book:', err)
      alert('Failed to remove book')
    }
  }
  
  const handleEditSuccess = () => {
    setShowEditModal(false)
    fetchCollection()
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse-slow text-4xl mb-4">📚</div>
        <p className="text-gray-400">Loading collection...</p>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/collections" className="text-library-accent hover:underline">
          ← Back to Collections
        </Link>
      </div>
    )
  }
  
  if (!collection) return null
  
  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => navigate('/collections')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <BackIcon />
          <span>Collections</span>
        </button>
        
        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <DotsIcon />
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowEditModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  <PencilIcon />
                  Edit Collection
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setRemoveMode(!removeMode)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  <XIcon />
                  {removeMode ? 'Done Removing' : 'Remove Books'}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowDeleteConfirm(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <TrashIcon />
                  Delete Collection
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Collection Info with Cover */}
      <div className="flex gap-4 mb-6">
        {/* Cover */}
        <div className="relative w-24 shrink-0">
          <MosaicCover 
            books={collection.books || collection.preview_books || []}
            coverType={collection.cover_type || 'mosaic'}
            coverPath={collection.custom_cover_path}
          />
          {/* Cover options button */}
          <button
            onClick={() => setShowCoverOptions(true)}
            className="absolute bottom-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
            title="Change cover"
          >
            <CameraIcon />
          </button>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white mb-1">
            {collection.name}
          </h1>
          <p className="text-gray-400">
            {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
          </p>
          {collection.description && (
            <p className="text-gray-300 mt-2 text-sm whitespace-pre-wrap line-clamp-3">
              {collection.description}
            </p>
          )}
        </div>
      </div>
      
      {/* Remove mode banner */}
      {removeMode && (
        <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center justify-between">
          <span className="text-red-200">Tap a book to remove it from this collection</span>
          <button
            onClick={() => setRemoveMode(false)}
            className="text-red-300 hover:text-red-100 font-medium"
          >
            Done
          </button>
        </div>
      )}
      
      {/* Books Grid */}
      {collection.books && collection.books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {collection.books.map(book => (
            <div key={book.id} className="relative">
              {removeMode ? (
                <button
                  onClick={() => handleRemoveBook(book.id)}
                  className="w-full text-left group"
                >
                  <div className="relative">
                    <BookCard book={book} />
                    {/* Remove overlay */}
                    <div className="absolute inset-0 bg-red-900/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-red-600 rounded-full p-2">
                        <XIcon />
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <BookCard book={book} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-400 mb-2">This collection is empty</p>
          <p className="text-gray-500 text-sm">
            Add books from the book detail page
          </p>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && (
        <CollectionModal
          collection={collection}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
      
      {/* Cover Options Modal */}
      {showCoverOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCoverOptions(false)}
          />
          <div className="relative w-full max-w-sm bg-library-card rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Collection Cover</h3>
            
            <div className="space-y-2">
              {/* Mosaic option */}
              <button
                onClick={() => handleCoverTypeChange('mosaic')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  collection.cover_type === 'mosaic' || !collection.cover_type
                    ? 'bg-library-accent/20 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 grid grid-cols-2 gap-0.5">
                  <div className="bg-blue-500 rounded-tl" />
                  <div className="bg-green-500 rounded-tr" />
                  <div className="bg-yellow-500 rounded-bl" />
                  <div className="bg-red-500 rounded-br" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Mosaic</div>
                  <div className="text-sm text-gray-400">Grid of book covers</div>
                </div>
              </button>
              
              {/* Gradient option */}
              <button
                onClick={() => handleCoverTypeChange('gradient')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  collection.cover_type === 'gradient'
                    ? 'bg-library-accent/20 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-pink-500" />
                <div className="text-left">
                  <div className="font-medium">Gradient</div>
                  <div className="text-sm text-gray-400">Simple color gradient</div>
                </div>
              </button>
              
              {/* Custom upload option */}
              <label
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  collection.cover_type === 'custom'
                    ? 'bg-library-accent/20 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                } ${uploadingCover ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center">
                  {uploadingCover ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <CameraIcon />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">Custom Image</div>
                  <div className="text-sm text-gray-400">Upload your own cover</div>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
              </label>
              
              {/* Delete custom cover button */}
              {collection.cover_type === 'custom' && collection.custom_cover_path && (
                <button
                  onClick={handleDeleteCover}
                  className="w-full px-4 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  Remove custom cover
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowCoverOptions(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-library-card rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Collection?
            </h3>
            <p className="text-gray-400 mb-6">
              This will delete "{collection.name}". Books will not be removed from your library.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


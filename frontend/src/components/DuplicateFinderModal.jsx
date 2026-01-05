import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { findDuplicates } from '../api'
import GradientCover from './GradientCover'

function DuplicateFinderModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && !results && !loading) {
      scanForDuplicates()
    }
  }, [isOpen])

  const scanForDuplicates = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await findDuplicates()
      setResults(data)
    } catch (err) {
      console.error('Failed to find duplicates:', err)
      setError(err.message || 'Failed to scan for duplicates')
    } finally {
      setLoading(false)
    }
  }

  const handleBookClick = (titleId) => {
    onClose()
    navigate(`/book/${titleId}`)
  }

  const handleClose = () => {
    setResults(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-[60]"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div 
          className="bg-library-bg border border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Find Duplicates</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg className="animate-spin h-8 w-8 mb-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Scanning library for duplicates...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            {results && !loading && (
              <>
                {results.groups.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">✨</div>
                    <div className="text-white font-medium mb-1">No duplicates found</div>
                    <div className="text-gray-400 text-sm">Your library is clean!</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-gray-400 text-sm">
                      Found {results.groups.length} potential duplicate {results.groups.length === 1 ? 'group' : 'groups'} ({results.total_duplicates} books)
                    </div>

                    {results.groups.map((group, groupIndex) => (
                      <div 
                        key={groupIndex}
                        className="bg-library-card rounded-lg p-4"
                      >
                        {/* Match info */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            group.match_type === 'exact' 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {group.match_type === 'exact' ? 'Exact Match' : 'Similar Title'}
                          </span>
                          {group.same_author && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                              Same Author
                            </span>
                          )}
                        </div>

                        {/* Books in group */}
                        <div className="space-y-2">
                          {group.books.map((book) => (
                            <button
                              key={book.id}
                              onClick={() => handleBookClick(book.id)}
                              className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors text-left"
                            >
                              {/* Cover */}
                              <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden">
                                <GradientCover
                                  title={book.title}
                                  colors={book.cover_gradient ? JSON.parse(book.cover_gradient) : null}
                                />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium truncate">
                                  {book.title}
                                </div>
                                <div className="text-gray-400 text-xs truncate">
                                  {book.authors}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-gray-500 text-xs">
                                    {book.edition_count} {book.edition_count === 1 ? 'edition' : 'editions'}
                                  </span>
                                  {book.category && (
                                    <span className="text-gray-500 text-xs">
                                      • {book.category}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Chevron */}
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                        </div>

                        {/* Hint */}
                        <div className="text-gray-500 text-xs mt-3 pt-3 border-t border-gray-700">
                          💡 Open a book and use "Merge Into..." from the menu to combine duplicates
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-700 flex justify-between items-center">
            {results && results.groups.length > 0 && (
              <button
                onClick={scanForDuplicates}
                disabled={loading}
                className="text-gray-400 hover:text-white text-sm"
              >
                Rescan
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-library-accent hover:opacity-90 text-white rounded text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default DuplicateFinderModal

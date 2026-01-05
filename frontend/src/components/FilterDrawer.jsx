import { useEffect } from 'react'
import { useStatusLabels } from '../hooks/useStatusLabels'

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

function FilterDrawer({ 
  isOpen, 
  onClose,
  // Filter state
  categories = ['All', 'FanFiction', 'Fiction', 'Non-Fiction', 'Uncategorized'],
  selectedCategory,
  onCategoryChange,
  statuses = ['Any', 'Unread', 'In Progress', 'Finished', 'DNF'],
  selectedStatus,
  onStatusChange,
  readTimeTiers = [],
  selectedReadTime,
  onReadTimeChange,
  onOpenTagsModal,
  selectedTagsCount = 0,
  onClearAll,
  showLibraryFilters = true, // Show status/readTime/tags (false for Series view)
  // Enhanced metadata filters (Phase 7.2)
  selectedFandom = '',
  onOpenFandomModal,
  selectedContentRating = [],
  onContentRatingChange,
  selectedCompletionStatus = [],
  onCompletionStatusChange,
  selectedShip = '',
  onOpenShipModal,
  // Format filter
  selectedFormats = [],
  onFormatsChange,
}) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Mobile Drawer - slides up from bottom */}
      <div 
        className={`fixed bottom-16 left-0 right-0 bg-library-card rounded-t-2xl z-50 transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-[calc(100%+4rem)]'
        }`}
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div className="p-4">
          {/* Handle bar */}
          <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-medium">Filters</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <XIcon />
            </button>
          </div>
          
          <FilterContent 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            statuses={statuses}
            selectedStatus={selectedStatus}
            onStatusChange={onStatusChange}
            readTimeTiers={readTimeTiers}
            selectedReadTime={selectedReadTime}
            onReadTimeChange={onReadTimeChange}
            onOpenTagsModal={onOpenTagsModal}
            selectedTagsCount={selectedTagsCount}
            onClearAll={onClearAll}
            onClose={onClose}
            showLibraryFilters={showLibraryFilters}
            selectedFandom={selectedFandom}
            onOpenFandomModal={onOpenFandomModal}
            selectedContentRating={selectedContentRating}
            onContentRatingChange={onContentRatingChange}
            selectedCompletionStatus={selectedCompletionStatus}
            onCompletionStatusChange={onCompletionStatusChange}
            selectedShip={selectedShip}
            onOpenShipModal={onOpenShipModal}
            selectedFormats={selectedFormats}
            onFormatsChange={onFormatsChange}
          />
        </div>
      </div>
      
      {/* Desktop Drawer - slides in from right */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-80 bg-library-card z-50 transition-transform duration-300 shadow-2xl hidden md:block ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-medium text-lg">Filters</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <XIcon />
            </button>
          </div>
          
          <FilterContent 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            statuses={statuses}
            selectedStatus={selectedStatus}
            onStatusChange={onStatusChange}
            readTimeTiers={readTimeTiers}
            selectedReadTime={selectedReadTime}
            onReadTimeChange={onReadTimeChange}
            onOpenTagsModal={onOpenTagsModal}
            selectedTagsCount={selectedTagsCount}
            onClearAll={onClearAll}
            onClose={onClose}
            showLibraryFilters={showLibraryFilters}
            selectedFandom={selectedFandom}
            onOpenFandomModal={onOpenFandomModal}
            selectedContentRating={selectedContentRating}
            onContentRatingChange={onContentRatingChange}
            selectedCompletionStatus={selectedCompletionStatus}
            onCompletionStatusChange={onCompletionStatusChange}
            selectedShip={selectedShip}
            onOpenShipModal={onOpenShipModal}
            selectedFormats={selectedFormats}
            onFormatsChange={onFormatsChange}
          />
        </div>
      </div>
    </>
  )
}

function FilterContent({
  categories,
  selectedCategory,
  onCategoryChange,
  statuses,
  selectedStatus,
  onStatusChange,
  readTimeTiers,
  selectedReadTime,
  onReadTimeChange,
  onOpenTagsModal,
  selectedTagsCount,
  onClearAll,
  onClose,
  showLibraryFilters = true,
  // Enhanced metadata filters (Phase 7.2)
  selectedFandom = '',
  onOpenFandomModal,
  selectedContentRating = [],
  onContentRatingChange,
  selectedCompletionStatus = [],
  onCompletionStatusChange,
  selectedShip = '',
  onOpenShipModal,
  // Format filter
  selectedFormats = [],
  onFormatsChange,
}) {
  const { getLabel } = useStatusLabels()
  
  // Enhanced filters only show for FanFiction category
  const showEnhancedFilters = showLibraryFilters && selectedCategory === 'FanFiction'
  
  // Content rating options
  const contentRatingOptions = [
    { value: 'General', label: 'General' },
    { value: 'Teen', label: 'Teen' },
    { value: 'Mature', label: 'Mature' },
    { value: 'Explicit', label: 'Explicit' },
    { value: 'Not Rated', label: 'Not Rated' },
  ]
  
  // Completion status options
  const completionStatusOptions = [
    { value: 'Complete', label: 'Complete' },
    { value: 'WIP', label: 'WIP' },
    { value: 'Abandoned', label: 'Abandoned' },
    { value: 'Hiatus', label: 'Hiatus' },
  ]
  
  const handleCategoryClick = (cat) => {
    onCategoryChange(cat === 'All' ? '' : cat)
  }

  const handleStatusClick = (status) => {
    onStatusChange(status === 'Any' ? '' : status)
  }

  return (
    <>
      {/* Categories */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = cat === 'All' ? !selectedCategory : selectedCategory === cat
            return (
              <button 
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isSelected 
                    ? 'bg-library-accent text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Library-only filters */}
      {showLibraryFilters && (
        <>
          {/* Status */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => {
                const isSelected = status === 'Any' ? !selectedStatus : selectedStatus === status
                return (
                  <button 
                    key={status}
                    onClick={() => handleStatusClick(status)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected 
                        ? 'bg-library-accent text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {status === 'Any' ? 'Any' : getLabel(status)}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Read Time */}
          {readTimeTiers.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Length</p>
              <select 
                value={selectedReadTime}
                onChange={(e) => onReadTimeChange(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-library-accent"
              >
                <option value="">Any length</option>
                {readTimeTiers.map(tier => (
                  <option key={tier.value} value={tier.value}>{tier.label}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Tags */}
          {onOpenTagsModal && (
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">Tags</p>
              <button 
                onClick={() => {
                  onOpenTagsModal()
                  onClose()
                }}
                className="w-full bg-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-600"
              >
                <span>
                  {selectedTagsCount > 0 ? `${selectedTagsCount} selected` : 'Select tags...'}
                </span>
                <ChevronDown />
              </button>
            </div>
          )}
          
          {/* Enhanced Metadata Filters - FanFiction only */}
          {showEnhancedFilters && (
            <>
              {/* Fandom */}
              {onOpenFandomModal && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Fandom</p>
                  <button 
                    onClick={() => {
                      onOpenFandomModal()
                      onClose()
                    }}
                    className="w-full bg-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-600"
                  >
                    <span>
                      {selectedFandom || 'Any fandom'}
                    </span>
                    <ChevronDown />
                  </button>
                </div>
              )}
              
              {/* Ship */}
              {onOpenShipModal && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Ship</p>
                  <button 
                    onClick={() => {
                      onOpenShipModal()
                      onClose()
                    }}
                    className="w-full bg-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-600"
                  >
                    <span>
                      {selectedShip || 'Any ship'}
                    </span>
                    <ChevronDown />
                  </button>
                </div>
              )}
              
              {/* Content Rating */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Content Rating</p>
                <div className="space-y-2">
                  {contentRatingOptions.map(option => (
                    <label 
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={(e) => {
                        e.preventDefault()
                        const newSelection = selectedContentRating.includes(option.value)
                          ? selectedContentRating.filter(v => v !== option.value)
                          : [...selectedContentRating, option.value]
                        onContentRatingChange(newSelection)
                      }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedContentRating.includes(option.value)
                          ? 'bg-library-accent border-library-accent'
                          : 'border-gray-500 group-hover:border-gray-400'
                      }`}>
                        {selectedContentRating.includes(option.value) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-gray-300 text-sm group-hover:text-white">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Completion Status */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">Completion Status</p>
                <div className="space-y-2">
                  {completionStatusOptions.map(option => (
                    <label 
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={(e) => {
                        e.preventDefault()
                        const newSelection = selectedCompletionStatus.includes(option.value)
                          ? selectedCompletionStatus.filter(v => v !== option.value)
                          : [...selectedCompletionStatus, option.value]
                        onCompletionStatusChange(newSelection)
                      }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedCompletionStatus.includes(option.value)
                          ? 'bg-library-accent border-library-accent'
                          : 'border-gray-500 group-hover:border-gray-400'
                      }`}>
                        {selectedCompletionStatus.includes(option.value) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-gray-300 text-sm group-hover:text-white">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Formats - show for all categories */}
          {onFormatsChange && (
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">Formats</p>
              <div className="space-y-2">
                {[
                  { value: 'ebook', label: 'Ebook' },
                  { value: 'physical', label: 'Physical' },
                  { value: 'audiobook', label: 'Audiobook' },
                  { value: 'web', label: 'Web' }
                ].map(({ value, label }) => (
                  <label 
                    key={value}
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={(e) => {
                      e.preventDefault()
                      if (selectedFormats.includes(value)) {
                        onFormatsChange(selectedFormats.filter(f => f !== value))
                      } else {
                        onFormatsChange([...selectedFormats, value])
                      }
                    }}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedFormats.includes(value)
                        ? 'bg-library-accent border-library-accent'
                        : 'border-gray-500 group-hover:border-gray-400'
                    }`}>
                      {selectedFormats.includes(value) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span className="text-gray-300 text-sm group-hover:text-white">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Apply Button */}
      <button 
        onClick={onClose}
        className="w-full bg-library-accent text-white rounded-lg py-3 font-medium hover:opacity-90 transition-opacity"
      >
        Apply Filters
      </button>
      
      {/* Clear Filters */}
      {onClearAll && (
        <button 
          onClick={() => {
            onClearAll()
            onClose()
          }}
          className="w-full text-gray-400 text-sm mt-3 hover:text-white transition-colors"
        >
          Clear all filters
        </button>
      )}
    </>
  )
}

export default FilterDrawer


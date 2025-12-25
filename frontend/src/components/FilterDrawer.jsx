import { useEffect } from 'react'

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
  sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'author', label: 'Author' },
    { value: 'updated', label: 'Recently Updated' },
    { value: 'year', label: 'Year' },
  ],
  selectedSort,
  onSortChange,
  readTimeTiers = [],
  selectedReadTime,
  onReadTimeChange,
  onOpenTagsModal,
  selectedTagsCount = 0,
  onClearAll,
  showLibraryFilters = true, // Show status/sort/readTime/tags (false for Series view)
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
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
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
            sortOptions={sortOptions}
            selectedSort={selectedSort}
            onSortChange={onSortChange}
            readTimeTiers={readTimeTiers}
            selectedReadTime={selectedReadTime}
            onReadTimeChange={onReadTimeChange}
            onOpenTagsModal={onOpenTagsModal}
            selectedTagsCount={selectedTagsCount}
            onClearAll={onClearAll}
            onClose={onClose}
            showLibraryFilters={showLibraryFilters}
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
            sortOptions={sortOptions}
            selectedSort={selectedSort}
            onSortChange={onSortChange}
            readTimeTiers={readTimeTiers}
            selectedReadTime={selectedReadTime}
            onReadTimeChange={onReadTimeChange}
            onOpenTagsModal={onOpenTagsModal}
            selectedTagsCount={selectedTagsCount}
            onClearAll={onClearAll}
            onClose={onClose}
            showLibraryFilters={showLibraryFilters}
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
  sortOptions,
  selectedSort,
  onSortChange,
  readTimeTiers,
  selectedReadTime,
  onReadTimeChange,
  onOpenTagsModal,
  selectedTagsCount,
  onClearAll,
  onClose,
  showLibraryFilters = true,
}) {
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
                    {status}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Sort */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">Sort by</p>
            <select 
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-library-accent"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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


const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
)

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

/**
 * SearchBar component with two modes:
 * - Desktop: Full inline search input with filter button
 * - Mobile (iconsOnly): Just search and filter icon buttons
 */
function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  showFilter = false,
  filterCount = 0,
  onFilterClick,
  onSearchClick,
  iconsOnly = false,
  searchActive = false,
}) {
  // Icons-only mode (mobile Browse/Wishlist)
  if (iconsOnly) {
    return (
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <button 
          onClick={onSearchClick}
          className={`relative p-2 rounded-lg transition-colors ${
            searchActive 
              ? 'bg-library-accent text-white' 
              : 'text-gray-400 hover:text-white hover:bg-library-card'
          }`}
          title="Search"
        >
          <SearchIcon />
        </button>
        
        {/* Filter Button */}
        {showFilter && (
          <button 
            onClick={onFilterClick}
            className="relative text-gray-400 hover:text-white hover:bg-library-card p-2 rounded-lg transition-colors"
            title="Filters"
          >
            <FilterIcon />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-library-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        )}
      </div>
    )
  }

  // Full search bar mode (desktop)
  return (
    <div className="flex items-center gap-2 flex-1 max-w-md">
      <div className="flex items-center gap-2 px-3 py-2 bg-library-card rounded-lg flex-1">
        {/* Search Icon */}
        <span className="text-gray-400">
          <SearchIcon />
        </span>
        
        {/* Search Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
        />
        
        {/* Clear button when there's text */}
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-gray-500 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Filter Button */}
      {showFilter && (
        <button 
          onClick={onFilterClick}
          className="relative text-gray-400 hover:text-white p-2 transition-colors"
          title="Filters"
        >
          <FilterIcon />
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-library-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

export default SearchBar

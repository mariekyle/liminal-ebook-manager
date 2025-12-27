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

function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  showFilter = false,
  filterCount = 0,
  onFilterClick,
}) {
  return (
    <div className="bg-library-card rounded-lg mx-4 md:mx-0 md:rounded-none">
      <div className="flex items-center gap-2 px-3 py-2 md:px-8 md:py-3">
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
          className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
        />
        
        {/* Filter Button */}
        {showFilter && (
          <>
            <div className="w-px h-6 bg-gray-600" />
            <button 
              onClick={onFilterClick}
              className="relative text-gray-400 hover:text-white transition-colors p-2"
              title="Filters"
            >
              <FilterIcon />
              {filterCount > 0 && (
                <span className="absolute top-0 right-0 bg-library-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default SearchBar



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
 * SearchBar — inline search + optional filter (Library toolbar).
 * Kept as custom wrapper (filter affordance); colors use design tokens.
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
  if (iconsOnly) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSearchClick}
          className={`relative p-2 rounded-lg transition-all duration-200 ease-out min-w-[44px] min-h-[44px] flex items-center justify-center ${
            searchActive
              ? 'bg-action-primary text-text-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'
          }`}
          title="Search"
        >
          <SearchIcon />
        </button>

        {showFilter && (
          <button
            type="button"
            onClick={onFilterClick}
            className="relative text-text-muted hover:text-text-primary hover:bg-bg-surface p-2 rounded-lg transition-all duration-200 ease-out min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Filters"
          >
            <FilterIcon />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-action-primary text-text-primary text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-1 max-w-md">
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded-lg flex-1 border border-border-default">
        <span className="text-text-muted">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-body-sm"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-text-muted hover:text-text-primary min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showFilter && (
        <button
          type="button"
          onClick={onFilterClick}
          className="relative text-text-muted hover:text-text-primary p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Filters"
        >
          <FilterIcon />
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-action-primary text-text-primary text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

export default SearchBar

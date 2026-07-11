import { useEffect } from 'react'
import { useStatusLabels } from '../hooks/useStatusLabels'
import Button from './ui/Button'
import IconButton from './ui/IconButton'
import FormField from './ui/FormField'
import { COARSE_FORMATS, formatLabel } from '../constants/formats'

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const DRAWER_PANEL =
  'fixed top-0 right-0 h-full w-full sm:w-80 bg-bg-surface border-l border-border-default z-50 transform transition-transform duration-200 ease-out overflow-y-auto'

function FilterDrawer({
  isOpen,
  onClose,
  categories = ['All', 'FanFiction', 'Fiction', 'Non-Fiction', 'Uncategorized'],
  selectedCategory,
  onCategoryChange,
  statuses = ['Any', 'Unread', 'In Progress', 'Finished', 'Abandoned'],
  selectedStatus,
  onStatusChange,
  readTimeTiers = [],
  selectedReadTime,
  onReadTimeChange,
  onOpenTagsModal,
  selectedTagsCount = 0,
  onClearAll,
  showLibraryFilters = true,
  selectedFandom = '',
  onOpenFandomModal,
  selectedContentRating = [],
  onContentRatingChange,
  selectedCompletionStatus = [],
  onCompletionStatusChange,
  selectedShip = '',
  onOpenShipModal,
  selectedFormats = [],
  onFormatsChange,
}) {
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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const filterBody = (
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
  )

  return (
    <>
      <div
        className={`fixed inset-0 bg-bg-overlay z-40 transition-opacity duration-200 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`${DRAWER_PANEL} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className="flex flex-col min-h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle flex-shrink-0">
            <h2 className="text-h4 text-text-primary">Filters</h2>
            <IconButton type="button" variant="default" size="md" onClick={onClose} aria-label="Close filters" tooltip="Close">
              <XIcon />
            </IconButton>
          </div>
          <div className="p-4 md:p-6 flex-1">{filterBody}</div>
          <div className="flex gap-3 p-4 border-t border-border-default flex-shrink-0 mt-auto">
            {onClearAll && (
              <Button variant="ghost" size="md" onClick={() => { onClearAll(); onClose() }}>
                Clear
              </Button>
            )}
            <Button variant="primary" size="md" onClick={onClose} className="flex-1">
              Apply
            </Button>
          </div>
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
  onClearAll: _onClearAll,
  onClose,
  showLibraryFilters = true,
  selectedFandom = '',
  onOpenFandomModal,
  selectedContentRating = [],
  onContentRatingChange,
  selectedCompletionStatus = [],
  onCompletionStatusChange,
  selectedShip = '',
  onOpenShipModal,
  selectedFormats = [],
  onFormatsChange,
}) {
  const { getLabel } = useStatusLabels()
  const showEnhancedFilters = showLibraryFilters && selectedCategory === 'FanFiction'

  const contentRatingOptions = [
    { value: 'General', label: 'General' },
    { value: 'Teen', label: 'Teen' },
    { value: 'Mature', label: 'Mature' },
    { value: 'Explicit', label: 'Explicit' },
    { value: 'Not Rated', label: 'Not Rated' },
  ]

  const completionStatusOptions = [
    { value: 'Complete', label: 'Complete' },
    { value: 'WIP', label: 'WIP' },
    { value: 'Abandoned', label: getLabel('Abandoned') },
    { value: 'Hiatus', label: 'Hiatus' },
  ]

  const pillBtn = (isSelected) =>
    `min-h-[44px] px-3 py-1.5 rounded-full text-body-sm transition-all duration-200 ease-out ${
      isSelected
        ? 'bg-action-primary text-text-primary'
        : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface hover:text-text-primary'
    }`

  return (
    <>
      <div className="mb-4">
        <p className="text-label text-text-body mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = cat === 'All' ? !selectedCategory : selectedCategory === cat
            return (
              <button key={cat} type="button" onClick={() => onCategoryChange(cat === 'All' ? '' : cat)} className={pillBtn(isSelected)}>
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {showLibraryFilters && (
        <>
          <div className="mb-4">
            <p className="text-label text-text-body mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => {
                const isSelected = status === 'Any' ? !selectedStatus : selectedStatus === status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange(status === 'Any' ? '' : status)}
                    className={pillBtn(isSelected)}
                  >
                    {status === 'Any' ? 'Any' : getLabel(status)}
                  </button>
                )
              })}
            </div>
          </div>

          {readTimeTiers.length > 0 && (
            <div className="mb-4">
              <FormField label="Length">
                <select
                  value={selectedReadTime}
                  onChange={(e) => onReadTimeChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-default text-text-primary text-body-sm font-[inherit] focus:outline-none focus:border-action-primary focus:ring-[3px] focus:ring-action-primary/15"
                >
                  <option value="">Any length</option>
                  {readTimeTiers.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          )}

          {onOpenTagsModal && (
            <div className="mb-6">
              <p className="text-label text-text-body mb-2">Tags</p>
              <button
                type="button"
                onClick={() => {
                  onOpenTagsModal()
                  onClose()
                }}
                className="w-full min-h-[44px] bg-bg-elevated text-text-secondary rounded-lg px-3 py-2 text-body-sm flex items-center justify-between border border-border-default hover:bg-bg-surface transition-all duration-200 ease-out"
              >
                <span>{selectedTagsCount > 0 ? `${selectedTagsCount} selected` : 'Select tags...'}</span>
                <ChevronDown />
              </button>
            </div>
          )}

          {showEnhancedFilters && (
            <>
              {onOpenFandomModal && (
                <div className="mb-4">
                  <p className="text-label text-text-body mb-2">Fandom</p>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFandomModal()
                      onClose()
                    }}
                    className="w-full min-h-[44px] bg-bg-elevated text-text-secondary rounded-lg px-3 py-2 text-body-sm flex items-center justify-between border border-border-default hover:bg-bg-surface transition-all duration-200 ease-out"
                  >
                    <span>{selectedFandom || 'Any fandom'}</span>
                    <ChevronDown />
                  </button>
                </div>
              )}

              {onOpenShipModal && (
                <div className="mb-4">
                  <p className="text-label text-text-body mb-2">Ship</p>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenShipModal()
                      onClose()
                    }}
                    className="w-full min-h-[44px] bg-bg-elevated text-text-secondary rounded-lg px-3 py-2 text-body-sm flex items-center justify-between border border-border-default hover:bg-bg-surface transition-all duration-200 ease-out"
                  >
                    <span>{selectedShip || 'Any ship'}</span>
                    <ChevronDown />
                  </button>
                </div>
              )}

              <div className="mb-4">
                <p className="text-label text-text-body mb-2">Content Rating</p>
                <div className="space-y-2">
                  {contentRatingOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group min-h-[44px]"
                      onClick={(e) => {
                        e.preventDefault()
                        const newSelection = selectedContentRating.includes(option.value)
                          ? selectedContentRating.filter((v) => v !== option.value)
                          : [...selectedContentRating, option.value]
                        onContentRatingChange(newSelection)
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedContentRating.includes(option.value)
                            ? 'bg-action-primary border-action-primary'
                            : 'border-border-default group-hover:border-action-primary'
                        }`}
                      >
                        {selectedContentRating.includes(option.value) && (
                          <span className="text-text-primary text-caption">✓</span>
                        )}
                      </div>
                      <span className="text-body-sm text-text-secondary group-hover:text-text-primary">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-label text-text-body mb-2">Completion Status</p>
                <div className="space-y-2">
                  {completionStatusOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group min-h-[44px]"
                      onClick={(e) => {
                        e.preventDefault()
                        const newSelection = selectedCompletionStatus.includes(option.value)
                          ? selectedCompletionStatus.filter((v) => v !== option.value)
                          : [...selectedCompletionStatus, option.value]
                        onCompletionStatusChange(newSelection)
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedCompletionStatus.includes(option.value)
                            ? 'bg-action-primary border-action-primary'
                            : 'border-border-default group-hover:border-action-primary'
                        }`}
                      >
                        {selectedCompletionStatus.includes(option.value) && (
                          <span className="text-text-primary text-caption">✓</span>
                        )}
                      </div>
                      <span className="text-body-sm text-text-secondary group-hover:text-text-primary">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {onFormatsChange && (
            <div className="mb-6">
              <p className="text-label text-text-body mb-2">Formats</p>
              <div className="space-y-2">
                {COARSE_FORMATS.map((value) => ({ value, label: formatLabel(value) })).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 cursor-pointer group min-h-[44px]"
                    onClick={(e) => {
                      e.preventDefault()
                      if (selectedFormats.includes(value)) {
                        onFormatsChange(selectedFormats.filter((f) => f !== value))
                      } else {
                        onFormatsChange([...selectedFormats, value])
                      }
                    }}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedFormats.includes(value)
                          ? 'bg-action-primary border-action-primary'
                          : 'border-border-default group-hover:border-action-primary'
                      }`}
                    >
                      {selectedFormats.includes(value) && <span className="text-text-primary text-caption">✓</span>}
                    </div>
                    <span className="text-body-sm text-text-secondary group-hover:text-text-primary">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default FilterDrawer

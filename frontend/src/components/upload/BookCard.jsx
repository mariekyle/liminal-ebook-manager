/**
 * BookCard.jsx (upload flow)
 *
 * Expandable metadata editing, duplicate / familiar-title resolution.
 */

import { useCallback } from 'react'
import FormField from '../ui/FormField'
import Button from '../ui/Button'

const CATEGORY_GRADIENTS = {
  FanFiction: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  Fiction: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'Non-Fiction': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  Uncategorized: 'linear-gradient(135deg, #666 0%, #888 100%)',
}

const CATEGORIES = ['FanFiction', 'Fiction', 'Non-Fiction', 'Uncategorized']

const selectClasses = `w-full h-11 px-3 rounded-lg text-body-sm text-text-primary bg-bg-elevated border border-border-default font-[inherit]
  transition-[border-color] duration-200 ease-out focus:outline-none focus:ring-[3px] focus:ring-action-primary/15 focus:border-border-focus`

export default function BookCard({
  book,
  index,
  totalBooks,
  isExpanded,
  onToggle,
  onUpdate,
  onDuplicateAction,
}) {
  const formatSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const handleFieldChange = useCallback(
    (field, value) => {
      onUpdate(book.id, { [field]: value })
    },
    [book.id, onUpdate],
  )

  const handleActionClick = useCallback(
    (action, extraData = null) => {
      onDuplicateAction(book.id, action, extraData)
    },
    [book.id, onDuplicateAction],
  )

  const isSkipped = book.action === 'skip'
  const hasUnresolvedDuplicate = book.duplicate && !book.action
  const hasUnresolvedFamiliar = book.familiar_title && !book.duplicate && !book.action
  const needsAttention = hasUnresolvedDuplicate || hasUnresolvedFamiliar

  return (
    <div
      className={`
        rounded-lg overflow-hidden transition-all duration-300 mb-3 border
        ${isExpanded ? 'border-action-primary bg-bg-elevated' : 'border-border-default bg-bg-surface'}
        ${isSkipped ? 'opacity-50' : ''}
      `}
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        onClick={onToggle}
        className="p-4 cursor-pointer flex items-start gap-3"
      >
        <div
          className="w-[60px] h-[80px] rounded flex items-center justify-center text-[10px] text-text-primary font-medium shrink-0"
          style={{
            background: CATEGORY_GRADIENTS[book.category] || CATEGORY_GRADIENTS.Uncategorized,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {book.category === 'Non-Fiction' ? 'NON-FIC' : book.category?.toUpperCase().slice(0, 7)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-body-sm text-text-secondary flex items-center gap-1">
            📚 Book {index + 1} of {totalBooks} {isExpanded ? '▼' : '▶'}
            {needsAttention && <span className="ml-1">⚠️</span>}
          </div>
          <div className={`text-[15px] font-medium mt-1 text-text-primary ${isSkipped ? 'line-through' : ''}`}>
            {book.title}
          </div>
          <div className="text-[13px] text-text-secondary mt-0.5">
            {book.category}{' '}
            {book.category_confidence > 0 && `(${Math.round(book.category_confidence * 100)}%)`} •{' '}
            {book.files.length} file{book.files.length !== 1 ? 's' : ''} • {book.author}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div
          className="px-4 pb-4 border-t border-border-default"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {book.duplicate && (
            <DuplicateBanner
              duplicate={book.duplicate}
              action={book.action}
              onActionClick={handleActionClick}
            />
          )}

          {book.familiar_title && !book.duplicate && (
            <FamiliarTitleBanner
              familiarTitle={book.familiar_title}
              action={book.action}
              fileCount={book.files.length}
              onActionClick={handleActionClick}
            />
          )}

          {book.action !== 'add_format' && book.action !== 'add_to_existing' && book.action !== 'skip' && (
            <div className="mt-4 space-y-4">
              <FormField label="Author" value={book.author} onChange={(v) => handleFieldChange('author', v)} />

              <FormField label="Title" value={book.title} onChange={(v) => handleFieldChange('title', v)} />

              <div className="flex gap-3">
                <div className="flex-1">
                  <FormField
                    label="Series (optional)"
                    value={book.series || ''}
                    onChange={(v) => handleFieldChange('series', v || null)}
                    placeholder="Series name"
                  />
                </div>
                <div className="w-20">
                  <FormField
                    label="#"
                    value={book.series_number || ''}
                    onChange={(v) => handleFieldChange('series_number', v || null)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-label text-text-body mb-1.5">Category</label>
                <div className="flex items-center gap-2">
                  <select
                    value={book.category}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className={`${selectClasses} flex-1`}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {book.category_confidence > 0 && (
                    <span className="text-caption px-2 py-1 rounded bg-bg-elevated text-action-primary border border-border-default whitespace-nowrap">
                      auto • {Math.round(book.category_confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="text-body-sm text-text-secondary mb-2">
              {book.files.length} file{book.files.length !== 1 ? 's' : ''}
            </div>
            {book.files.map((file, i) => (
              <div key={i} className="text-body-sm text-text-secondary py-1">
                • {file.name} ({formatSize(file.size)})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FamiliarTitleBanner({ familiarTitle, action, fileCount, onActionClick }) {
  if (!action) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-bg-elevated border border-action-primary">
        <div className="font-medium flex items-center gap-2 mb-2 text-text-primary">A Familiar Title</div>
        <p className="text-body-sm text-text-secondary mb-3">
          &quot;{familiarTitle.title}&quot; is in your library.{' '}
          {fileCount > 1 ? 'These files' : 'This file'} will be added as new format
          {fileCount > 1 ? 's' : ''}.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onActionClick('add_to_existing', { title_id: familiarTitle.title_id })}
          >
            Add to Existing
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick('skip')}>
            Skip
          </Button>
        </div>
        <div className="mt-2 pt-2 border-t border-border-default">
          <button
            type="button"
            onClick={() => onActionClick('new')}
            className="text-caption text-text-muted hover:text-action-primary underline min-h-[44px]"
          >
            Not the same? Add as separate title
          </button>
        </div>
      </div>
    )
  }

  if (action === 'add_to_existing') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-action-success/10 border border-action-success/40">
        <div className="font-medium flex items-center gap-2 mb-2 text-action-success">
          ✓ Adding to Existing Title
        </div>
        <p className="text-body-sm text-text-secondary mb-3">
          {fileCount > 1 ? 'These files' : 'This file'} will be added to &quot;{familiarTitle.title}&quot;.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick(null)}>
          Change
        </Button>
      </div>
    )
  }

  if (action === 'skip') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-bg-elevated border border-border-default">
        <div className="font-medium flex items-center gap-2 mb-2 text-text-primary">⏭️ Skipping This Book</div>
        <p className="text-body-sm text-text-muted mb-3">
          {fileCount > 1 ? 'These files' : 'This file'} will not be uploaded.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick(null)}>
          Undo
        </Button>
      </div>
    )
  }

  if (action === 'new') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-action-success/10 border border-action-success/40">
        <div className="font-medium flex items-center gap-2 mb-2 text-action-success">
          ✓ Uploading as New Title
        </div>
        <p className="text-body-sm text-text-secondary mb-3">
          This will be uploaded as a separate title, not linked to &quot;{familiarTitle.title}&quot;.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick(null)}>
          Change
        </Button>
      </div>
    )
  }

  return null
}

function DuplicateBanner({ duplicate, action, onActionClick }) {
  if (!action) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-bg-elevated border border-border-focus">
        <div className="font-medium flex items-center gap-2 mb-2 text-text-primary">⚠️ Book Already Exists</div>
        <p className="text-body-sm text-text-secondary mb-3">
          {duplicate.type === 'exact_match'
            ? 'This exact file already exists in your library.'
            : 'You have a different format in your library:'}
        </p>

        <div className="bg-bg-surface rounded p-3 mb-2 border border-border-subtle">
          <div className="text-caption text-text-muted mb-1">In your library:</div>
          <div className="text-[13px] text-text-secondary">📄 {duplicate.existing_files.join(', ')}</div>
        </div>
        {duplicate.type === 'different_format' && duplicate.new_files && (
          <div className="bg-bg-surface rounded p-3 mb-3 border border-border-subtle">
            <div className="text-caption text-text-muted mb-1">You&apos;re uploading:</div>
            <div className="text-[13px] text-action-success">📄 {duplicate.new_files.join(', ')} ← NEW FORMAT</div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {duplicate.type === 'different_format' && (
            <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick('add_format')}>
              Add Format
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick('replace')}>
            Replace
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick('skip')}>
            Skip
          </Button>
        </div>
        <div className="mt-2 pt-2 border-t border-border-default">
          <button
            type="button"
            onClick={() => onActionClick('new')}
            className="text-caption text-text-muted hover:text-action-primary underline min-h-[44px]"
          >
            Not a match? Upload as separate book
          </button>
        </div>
      </div>
    )
  }

  if (action === 'add_format') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-action-success/10 border border-action-success/40">
        <div className="font-medium flex items-center gap-2 mb-2 text-action-success">✓ Adding New Format</div>
        <p className="text-body-sm text-text-secondary mb-3">
          The new format will be added to your existing book. No metadata changes needed.
        </p>
        <div className="bg-bg-surface rounded p-3 mb-3 border border-border-subtle">
          <div className="text-caption text-text-muted mb-1">Will be added:</div>
          <div className="text-[13px] text-action-success">📄 {duplicate.new_files?.join(', ')}</div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick(null)}>
          Change
        </Button>
      </div>
    )
  }

  if (action === 'replace') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-bg-elevated border border-action-primary">
        <div className="font-medium flex items-center gap-2 mb-2 text-text-primary">🔄 Replacing Existing Book</div>
        <p className="text-body-sm text-text-secondary mb-3">
          The existing book will be deleted. Edit metadata below if needed:
        </p>
        <div className="bg-bg-surface rounded p-3 mb-2 border border-border-subtle">
          <div className="text-caption text-text-muted mb-1">Will be DELETED:</div>
          <div className="text-[13px] text-action-danger">📄 {duplicate.existing_files.join(', ')} ❌</div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick(null)}>
          Change
        </Button>
      </div>
    )
  }

  if (action === 'skip') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-bg-elevated border border-border-default">
        <div className="font-medium flex items-center gap-2 mb-2 text-text-primary">⏭️ Skipping This Book</div>
        <p className="text-body-sm text-text-muted mb-3">This file will not be uploaded.</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick(null)}>
          Undo
        </Button>
      </div>
    )
  }

  if (action === 'new') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-action-success/10 border border-action-success/40">
        <div className="font-medium flex items-center gap-2 mb-2 text-action-success">✓ Uploading as New Book</div>
        <p className="text-body-sm text-text-secondary mb-3">
          This will be uploaded as a separate book, ignoring the duplicate match.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => onActionClick(null)}>
          Change
        </Button>
      </div>
    )
  }

  return null
}

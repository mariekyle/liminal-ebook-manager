import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedNavBar from '../components/ui/UnifiedNavBar';
import Button from '../components/ui/Button';
import { useStatusLabels } from '../hooks/useStatusLabels';

const API_BASE = '/api';

function Stars({ rating }) {
  if (!rating) return <span className="text-text-muted">—</span>;
  return (
    <span className="text-action-warning">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function StatusBadge({ status }) {
  const { getLabel } = useStatusLabels();
  const colors = {
    'Finished': 'bg-status-finished/20 text-status-finished',
    'In Progress': 'bg-status-reading/20 text-status-reading',
    'DNF': 'bg-status-dnf/20 text-status-dnf',
    'Abandoned': 'bg-status-dnf/20 text-status-dnf',
    'Unread': 'bg-bg-elevated text-text-muted',
  };
  const colorKey = status === 'Abandoned' ? 'Abandoned' : status === 'DNF' ? 'DNF' : status;
  const labelKey = status === 'DNF' ? 'Abandoned' : status;
  return (
    <span className={`px-2 py-0.5 rounded text-caption font-medium ${colors[colorKey] || colors['Unread']}`}>
      {getLabel(labelKey)}
    </span>
  );
}

function ConfidenceBadge({ confidence, status }) {
  if (status === 'no_match') {
    return <span className="text-action-danger text-body-sm">❌ No match</span>;
  }
  if (status === 'low_confidence') {
    return <span className="text-action-warning text-body-sm">⚠️ {Math.round(confidence * 100)}% match</span>;
  }
  return <span className="text-action-success text-body-sm">✓ {Math.round(confidence * 100)}% match</span>;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch current stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/import/stats`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle file selection
  const handleFiles = useCallback(async (fileList) => {
    const mdFiles = Array.from(fileList).filter(f => f.name.endsWith('.md'));
    if (mdFiles.length === 0) {
      alert('Please select .md files');
      return;
    }

    setFiles(mdFiles);
    setLoading(true);
    setPreviews([]);
    setSelectedItems(new Set());
    setImportResults(null);

    try {
      // Read all files
      const notes = await Promise.all(
        mdFiles.map(async (file) => {
          const content = await file.text();
          return { filename: file.name, content };
        })
      );

      // Send to preview endpoint
      const res = await fetch(`${API_BASE}/import/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error('Preview failed');
      
      const data = await res.json();
      setPreviews(data.items);

      // Auto-select all matched items with importable data
      const autoSelect = new Set();
      data.items.forEach((item, idx) => {
        if (item.match_status === 'matched' && Object.keys(item.will_import).length > 0) {
          autoSelect.add(idx);
        }
      });
      setSelectedItems(autoSelect);

    } catch (e) {
      console.error('Preview error:', e);
      alert('Failed to preview files: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Toggle selection
  const toggleSelection = useCallback((idx) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  // Select all / none
  const selectAll = useCallback(() => {
    const all = new Set();
    previews.forEach((item, idx) => {
      if (item.match && Object.keys(item.will_import).length > 0) {
        all.add(idx);
      }
    });
    setSelectedItems(all);
  }, [previews]);

  const selectNone = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Import selected
  const handleImport = useCallback(async () => {
    if (selectedItems.size === 0) {
      alert('No items selected');
      return;
    }

    setImporting(true);

    try {
      const imports = [];
      selectedItems.forEach(idx => {
        const item = previews[idx];
        if (item.match) {
          imports.push({
            book_id: item.match.id,
            ...item.will_import,
          });
        }
      });

      const res = await fetch(`${API_BASE}/import/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imports }),
      });

      if (!res.ok) throw new Error('Import failed');

      const results = await res.json();
      setImportResults(results);
      
      // Refresh stats
      fetchStats();

    } catch (e) {
      console.error('Import error:', e);
      alert('Import failed: ' + e.message);
    } finally {
      setImporting(false);
    }
  }, [selectedItems, previews, fetchStats]);

  // Reset to start over
  const handleReset = useCallback(() => {
    setFiles([]);
    setPreviews([]);
    setSelectedItems(new Set());
    setImportResults(null);
  }, []);

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      <UnifiedNavBar title="Import" />

      <main className="max-w-4xl mx-auto p-4">
        {stats && (
          <p className="text-body-sm text-text-secondary mb-4">
            {stats.with_ratings} rated · {stats.with_dates} with dates
          </p>
        )}
        {/* Import Results */}
        {importResults && (
          <div className="mb-6 p-4 bg-action-success/10 border border-action-success/30 rounded-lg">
            <h2 className="font-semibold text-action-success mb-2 text-h4">
              ✅ Import Complete
            </h2>
            <p className="text-text-secondary text-body-sm">
              Successfully imported {importResults.success_count} books.
              {importResults.error_count > 0 && (
                <span className="text-action-danger ml-2">
                  {importResults.error_count} errors.
                </span>
              )}
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Button variant="primary" size="sm" onClick={handleReset}>
                Import More
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                Back to Library
              </Button>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!importResults && previews.length === 0 && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ease-out
              ${dragOver ? 'border-action-primary bg-action-primary/5' : 'border-border-default bg-bg-surface'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-3">📄</div>
            <h2 className="text-h4 mb-2">Drop Obsidian book notes here</h2>
            <p className="text-text-secondary text-body-sm mb-4">
              or click to select .md files
            </p>
            <input
              type="file"
              multiple
              accept=".md"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-block px-4 py-2 bg-action-primary text-text-primary rounded-lg cursor-pointer hover:bg-action-primary-hover transition-colors"
            >
              Select Files
            </label>

            <div className="mt-6 pt-6 border-t border-border-default text-body-sm text-text-muted">
              <p className="font-medium mb-2">What gets imported:</p>
              <div className="flex justify-center gap-6">
                <span>✓ Status</span>
                <span>✓ Rating</span>
                <span>✓ Start date</span>
                <span>✓ Finish date</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-text-secondary text-body-sm">Parsing {files.length} files...</p>
          </div>
        )}

        {/* Preview List */}
        {!loading && previews.length > 0 && !importResults && (
          <>
            {/* Summary bar */}
            <div className="bg-bg-surface rounded-lg border border-border-default p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-body-sm text-text-secondary">
                  <span className="font-medium text-text-primary">{previews.length}</span> files parsed ·{' '}
                  <span className="text-action-success">{previews.filter(p => p.match_status === 'matched').length} matched</span> ·{' '}
                  <span className="text-action-warning">{previews.filter(p => p.match_status === 'low_confidence').length} low confidence</span> ·{' '}
                  <span className="text-action-danger">{previews.filter(p => p.match_status === 'no_match').length} no match</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-body-sm text-action-primary hover:underline min-h-[44px] px-1">
                    Select all
                  </button>
                  <span className="text-border-default">|</span>
                  <button type="button" onClick={selectNone} className="text-body-sm text-action-primary hover:underline min-h-[44px] px-1">
                    Select none
                  </button>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {previews.map((item, idx) => {
                const hasData = Object.keys(item.will_import).length > 0;
                const canImport = item.match && hasData;
                const isSelected = selectedItems.has(idx);

                return (
                  <div
                    key={idx}
                    className={`
                      bg-bg-surface rounded-lg border border-border-default p-4 transition-colors
                      ${isSelected ? 'border-action-primary bg-action-primary/5' : ''}
                      ${!canImport ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(idx)}
                        disabled={!canImport}
                        className="mt-1"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate text-text-primary">
                            {item.parsed.title || item.filename}
                          </span>
                          {item.parsed.authors.length > 0 && (
                            <span className="text-text-muted text-body-sm">
                              by {item.parsed.authors.join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Match status */}
                        <div className="flex items-center gap-3 text-sm mb-2">
                          <ConfidenceBadge
                            confidence={item.match?.confidence || 0}
                            status={item.match_status}
                          />
                          {item.match && item.match_status !== 'no_match' && (
                            <span className="text-text-muted text-body-sm">
                              → {item.match.title}
                              {item.match.series && ` (${item.match.series})`}
                            </span>
                          )}
                        </div>

                        {/* What will be imported */}
                        {hasData ? (
                          <div className="flex flex-wrap gap-3 text-sm">
                            {item.will_import.status && (
                              <StatusBadge status={item.will_import.status} />
                            )}
                            {item.will_import.rating && (
                              <Stars rating={item.will_import.rating} />
                            )}
                            {item.will_import.date_started && (
                              <span className="text-text-secondary text-body-sm">
                                Started: {item.will_import.date_started}
                              </span>
                            )}
                            {item.will_import.date_finished && (
                              <span className="text-text-secondary text-body-sm">
                                Finished: {item.will_import.date_finished}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-body-sm text-text-muted">
                            No importable data (status=Unread, no rating/dates)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action bar */}
            <div className="sticky bottom-0 bg-bg-base/95 backdrop-blur-sm border-t border-border-default py-4 -mx-4 px-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary text-body-sm min-h-[44px]"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-body-sm text-text-secondary">
                    {selectedItems.size} selected
                  </span>
                  <Button
                    variant="primary"
                    onClick={handleImport}
                    disabled={selectedItems.size === 0 || importing}
                    loading={importing}
                  >
                    {`Import ${selectedItems.size} books`}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

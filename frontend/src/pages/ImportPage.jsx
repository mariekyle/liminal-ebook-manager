import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

// Star display component
function Stars({ rating }) {
  if (!rating) return <span className="text-gray-400">—</span>;
  return (
    <span className="text-yellow-500">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

// Status badge component
function StatusBadge({ status }) {
  const colors = {
    'Finished': 'bg-green-100 text-green-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'DNF': 'bg-red-100 text-red-800',
    'Unread': 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors['Unread']}`}>
      {status}
    </span>
  );
}

// Confidence indicator
function ConfidenceBadge({ confidence, status }) {
  if (status === 'no_match') {
    return <span className="text-red-600 text-sm">❌ No match</span>;
  }
  if (status === 'low_confidence') {
    return <span className="text-yellow-600 text-sm">⚠️ {Math.round(confidence * 100)}% match</span>;
  }
  return <span className="text-green-600 text-sm">✓ {Math.round(confidence * 100)}% match</span>;
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

  // Load stats on mount
  useState(() => {
    fetchStats();
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold">Import from Obsidian</h1>
          </div>
          {stats && (
            <div className="text-sm text-gray-500">
              {stats.with_ratings} rated · {stats.with_dates} with dates
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Import Results */}
        {importResults && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="font-semibold text-green-800 mb-2">
              ✅ Import Complete
            </h2>
            <p className="text-green-700">
              Successfully imported {importResults.success_count} books.
              {importResults.error_count > 0 && (
                <span className="text-red-600 ml-2">
                  {importResults.error_count} errors.
                </span>
              )}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Import More
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 bg-white border rounded hover:bg-gray-50"
              >
                Back to Library
              </button>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!importResults && previews.length === 0 && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-3">📄</div>
            <h2 className="text-lg font-medium mb-2">
              Drop Obsidian book notes here
            </h2>
            <p className="text-gray-500 mb-4">
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
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
            >
              Select Files
            </label>

            <div className="mt-6 pt-6 border-t text-sm text-gray-500">
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
            <p className="text-gray-600">Parsing {files.length} files...</p>
          </div>
        )}

        {/* Preview List */}
        {!loading && previews.length > 0 && !importResults && (
          <>
            {/* Summary bar */}
            <div className="bg-white rounded-lg border p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{previews.length}</span> files parsed ·{' '}
                  <span className="text-green-600">{previews.filter(p => p.match_status === 'matched').length} matched</span> ·{' '}
                  <span className="text-yellow-600">{previews.filter(p => p.match_status === 'low_confidence').length} low confidence</span> ·{' '}
                  <span className="text-red-600">{previews.filter(p => p.match_status === 'no_match').length} no match</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">
                    Select all
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={selectNone} className="text-sm text-blue-600 hover:underline">
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
                      bg-white rounded-lg border p-4 transition-colors
                      ${isSelected ? 'border-blue-500 bg-blue-50' : ''}
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
                          <span className="font-medium truncate">
                            {item.parsed.title || item.filename}
                          </span>
                          {item.parsed.authors.length > 0 && (
                            <span className="text-gray-500 text-sm">
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
                            <span className="text-gray-500">
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
                              <span className="text-gray-600">
                                Started: {item.will_import.date_started}
                              </span>
                            )}
                            {item.will_import.date_finished && (
                              <span className="text-gray-600">
                                Finished: {item.will_import.date_finished}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
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
            <div className="sticky bottom-0 bg-gray-50 border-t py-4 -mx-4 px-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} selected
                  </span>
                  <button
                    onClick={handleImport}
                    disabled={selectedItems.size === 0 || importing}
                    className={`
                      px-4 py-2 rounded font-medium
                      ${selectedItems.size > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                  >
                    {importing ? 'Importing...' : `Import ${selectedItems.size} books`}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

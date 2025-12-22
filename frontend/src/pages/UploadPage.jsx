/**
 * UploadPage.jsx
 * 
 * Main upload page component handling the full upload workflow:
 * 1. File selection
 * 2. Files selected confirmation
 * 3. Analyzing progress
 * 4. Review books
 * 5. Upload progress
 * 6. Success summary
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeUploadedFiles, finalizeUpload, cancelUpload } from '../api';

// Sub-components
import UploadZone from '../components/upload/UploadZone';
import FilesSelected from '../components/upload/FilesSelected';
import AnalyzingProgress from '../components/upload/AnalyzingProgress';
import ReviewBooks from '../components/upload/ReviewBooks';
import UploadProgress from '../components/upload/UploadProgress';
import UploadSuccess from '../components/upload/UploadSuccess';
import CancelModal from '../components/upload/CancelModal';

// Screen constants
const SCREENS = {
  SELECT: 'select',
  FILES_SELECTED: 'files_selected',
  ANALYZING: 'analyzing',
  REVIEW: 'review',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
};

export default function UploadPage() {
  const navigate = useNavigate();
  
  // Screen state
  const [currentScreen, setCurrentScreen] = useState(SCREENS.SELECT);
  
  // File selection state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Analysis state
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [books, setBooks] = useState([]);
  
  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  
  // Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);

  // ==========================================================================
  // FILE SELECTION
  // ==========================================================================

  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    setCurrentScreen(SCREENS.FILES_SELECTED);
    setError(null);
  }, []);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleSelectDifferent = useCallback(() => {
    setSelectedFiles([]);
    setCurrentScreen(SCREENS.SELECT);
    setError(null);
  }, []);

  // ==========================================================================
  // ANALYSIS
  // ==========================================================================

  const handleAnalyze = useCallback(async () => {
    setCurrentScreen(SCREENS.ANALYZING);
    setAnalyzeProgress(0);
    setError(null);

    try {
      const response = await analyzeUploadedFiles(selectedFiles, (progress) => {
        setAnalyzeProgress(progress);
      });

      setSessionId(response.session_id);
      setBooks(response.books.map(book => ({
        ...book,
        // Track user's action choice for duplicates
        action: book.duplicate ? null : 'new',
        // Track if user has edited metadata
        edited: false,
      })));
      setCurrentScreen(SCREENS.REVIEW);
    } catch (err) {
      setError(err.message);
      setCurrentScreen(SCREENS.FILES_SELECTED);
    }
  }, [selectedFiles]);

  // ==========================================================================
  // REVIEW & EDITING
  // ==========================================================================

  const handleBookUpdate = useCallback((bookId, updates) => {
    setBooks(prev => prev.map(book => 
      book.id === bookId 
        ? { ...book, ...updates, edited: true }
        : book
    ));
  }, []);

  const handleDuplicateAction = useCallback((bookId, action) => {
    setBooks(prev => prev.map(book =>
      book.id === bookId
        ? { ...book, action }
        : book
    ));
  }, []);

  // ==========================================================================
  // FINALIZATION
  // ==========================================================================

  const handleUpload = useCallback(async () => {
    setCurrentScreen(SCREENS.UPLOADING);
    setUploadProgress(0);
    setError(null);

    // Build book actions for API
    const bookActions = books.map(book => {
      const action = book.action || 'new';
      
      if (action === 'skip') {
        return { id: book.id, action: 'skip' };
      }
      
      if (action === 'add_format') {
        return {
          id: book.id,
          action: 'add_format',
          existing_folder: book.duplicate?.existing_folder,
        };
      }
      
      // 'new' or 'replace'
      return {
        id: book.id,
        action: action,
        title: book.title,
        author: book.author,
        series: book.series || null,
        series_number: book.series_number || null,
        category: book.category,
        existing_folder: book.duplicate?.existing_folder,
      };
    });

    try {
      // Simulate progress (actual progress tracking would need SSE or websocket)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await finalizeUpload(sessionId, bookActions);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResults(response);
      
      // Short delay before showing success
      setTimeout(() => {
        setCurrentScreen(SCREENS.SUCCESS);
      }, 500);
    } catch (err) {
      setError(err.message);
      setCurrentScreen(SCREENS.REVIEW);
    }
  }, [books, sessionId]);

  // ==========================================================================
  // CANCELLATION
  // ==========================================================================

  const handleCancel = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    setShowCancelModal(false);
    
    if (sessionId) {
      try {
        await cancelUpload(sessionId);
      } catch (err) {
        // Ignore cancel errors
        console.error('Cancel error:', err);
      }
    }
    
    // Reset state
    setSelectedFiles([]);
    setSessionId(null);
    setBooks([]);
    setUploadResults(null);
    setError(null);
    setCurrentScreen(SCREENS.SELECT);
  }, [sessionId]);

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const handleGoToLibrary = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleUploadMore = useCallback(() => {
    setSelectedFiles([]);
    setSessionId(null);
    setBooks([]);
    setUploadResults(null);
    setError(null);
    setCurrentScreen(SCREENS.SELECT);
  }, []);

  const handleBack = useCallback(() => {
    switch (currentScreen) {
      case SCREENS.FILES_SELECTED:
        setCurrentScreen(SCREENS.SELECT);
        break;
      case SCREENS.REVIEW:
        setCurrentScreen(SCREENS.FILES_SELECTED);
        break;
      default:
        break;
    }
  }, [currentScreen]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);
  
  const booksToUpload = books.filter(b => b.action !== 'skip').length;
  const filesToUpload = books
    .filter(b => b.action !== 'skip')
    .reduce((sum, b) => sum + b.files.length, 0);

  // Check if all duplicate books have an action selected
  const allDuplicatesResolved = books.every(book => 
    !book.duplicate || book.action !== null
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#3a3a3a] bg-[#1a1a1a] px-4 py-4">
        <div className="flex items-center max-w-2xl mx-auto">
          {currentScreen !== SCREENS.SELECT && 
           currentScreen !== SCREENS.UPLOADING && 
           currentScreen !== SCREENS.SUCCESS && (
            <button
              onClick={handleBack}
              className="text-[#667eea] mr-2 p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center"
            >
              ← Back
            </button>
          )}
          {currentScreen === SCREENS.SELECT && (
            <button
              onClick={handleGoToLibrary}
              className="text-[#667eea] mr-2 p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center"
            >
              ← Library
            </button>
          )}
          <h1 className="flex-1 text-lg font-semibold">
            {currentScreen === SCREENS.REVIEW 
              ? `Review (${books.length} books)`
              : currentScreen === SCREENS.SUCCESS
              ? 'Upload Complete'
              : 'Upload Books'}
          </h1>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-500 px-4 py-3 text-center">
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-300 underline text-sm mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4">
        {currentScreen === SCREENS.SELECT && (
          <UploadZone
            onFileSelect={handleFileSelect}
            onFileDrop={handleFileDrop}
            fileInputRef={fileInputRef}
          />
        )}

        {currentScreen === SCREENS.FILES_SELECTED && (
          <FilesSelected
            files={selectedFiles}
            totalSizeMB={totalSizeMB}
            onAnalyze={handleAnalyze}
            onSelectDifferent={handleSelectDifferent}
          />
        )}

        {currentScreen === SCREENS.ANALYZING && (
          <AnalyzingProgress progress={analyzeProgress} />
        )}

        {currentScreen === SCREENS.REVIEW && (
          <ReviewBooks
            books={books}
            onBookUpdate={handleBookUpdate}
            onDuplicateAction={handleDuplicateAction}
            onUpload={handleUpload}
            onCancel={handleCancel}
            booksToUpload={booksToUpload}
            filesToUpload={filesToUpload}
            canUpload={allDuplicatesResolved}
          />
        )}

        {currentScreen === SCREENS.UPLOADING && (
          <UploadProgress
            books={books}
            progress={uploadProgress}
          />
        )}

        {currentScreen === SCREENS.SUCCESS && (
          <UploadSuccess
            results={uploadResults}
            books={books}
            onGoToLibrary={handleGoToLibrary}
            onUploadMore={handleUploadMore}
          />
        )}
      </main>

      {/* Cancel Modal */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

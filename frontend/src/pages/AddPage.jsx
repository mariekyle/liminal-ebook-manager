/**
 * AddPage.jsx
 * 
 * Main "Add" page that routes between:
 * - Initial choice (library vs TBR)
 * - Library: format choice (ebook vs manual)
 * - Library: ebook upload flow
 * - Library: manual entry form
 * - TBR: entry form
 * 
 * Supports deep linking:
 * - /add → initial choice
 * - /add?mode=tbr → skip to TBR form
 * - /add?mode=library → skip to library choice
 * - /add?mode=upload → skip to ebook upload
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { analyzeUploadedFiles, finalizeUpload, cancelUpload, addToTBR, createTitle } from '../api'

// Choice screens
import AddChoice from '../components/add/AddChoice'
import LibraryChoice from '../components/add/LibraryChoice'

// Form screens
import TBRForm from '../components/add/TBRForm'
import ManualEntryForm from '../components/add/ManualEntryForm'
import AddSuccess from '../components/add/AddSuccess'

// Existing upload components
import UploadZone from '../components/upload/UploadZone'
import FilesSelected from '../components/upload/FilesSelected'
import AnalyzingProgress from '../components/upload/AnalyzingProgress'
import ReviewBooks from '../components/upload/ReviewBooks'
import UploadProgress from '../components/upload/UploadProgress'
import UploadSuccess from '../components/upload/UploadSuccess'
import CancelModal from '../components/upload/CancelModal'

// Screen constants
const SCREENS = {
  // Choice screens
  MAIN_CHOICE: 'main_choice',
  LIBRARY_CHOICE: 'library_choice',
  
  // TBR flow
  TBR_FORM: 'tbr_form',
  
  // Manual library entry
  MANUAL_FORM: 'manual_form',
  
  // Ebook upload flow (existing)
  UPLOAD_SELECT: 'upload_select',
  UPLOAD_FILES_SELECTED: 'upload_files_selected',
  UPLOAD_ANALYZING: 'upload_analyzing',
  UPLOAD_REVIEW: 'upload_review',
  UPLOAD_UPLOADING: 'upload_uploading',
  UPLOAD_SUCCESS: 'upload_success',
  
  // Shared
  SUCCESS: 'success',
}

// Arrow left icon
const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

export default function AddPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Determine initial screen based on URL params
  const getInitialScreen = () => {
    const mode = searchParams.get('mode')
    if (mode === 'tbr') return SCREENS.TBR_FORM
    if (mode === 'library') return SCREENS.LIBRARY_CHOICE
    if (mode === 'upload') return SCREENS.UPLOAD_SELECT
    return SCREENS.MAIN_CHOICE
  }
  
  // Screen state
  const [currentScreen, setCurrentScreen] = useState(getInitialScreen)
  
  // Success state
  const [successType, setSuccessType] = useState(null) // 'tbr' or 'library'
  const [successTitle, setSuccessTitle] = useState(null)
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  // ========== UPLOAD STATE (from original UploadPage) ==========
  const [selectedFiles, setSelectedFiles] = useState([])
  const fileInputRef = useRef(null)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [sessionId, setSessionId] = useState(null)
  const [books, setBooks] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // ========== NAVIGATION ==========
  
  const handleMainChoice = (choice) => {
    if (choice === 'tbr') {
      setCurrentScreen(SCREENS.TBR_FORM)
    } else {
      setCurrentScreen(SCREENS.LIBRARY_CHOICE)
    }
  }
  
  const handleLibraryChoice = (choice) => {
    if (choice === 'ebook') {
      setCurrentScreen(SCREENS.UPLOAD_SELECT)
    } else {
      setCurrentScreen(SCREENS.MANUAL_FORM)
    }
  }
  
  const handleBack = () => {
    switch (currentScreen) {
      case SCREENS.TBR_FORM:
      case SCREENS.LIBRARY_CHOICE:
        setCurrentScreen(SCREENS.MAIN_CHOICE)
        break
      case SCREENS.MANUAL_FORM:
      case SCREENS.UPLOAD_SELECT:
        setCurrentScreen(SCREENS.LIBRARY_CHOICE)
        break
      case SCREENS.UPLOAD_FILES_SELECTED:
        setCurrentScreen(SCREENS.UPLOAD_SELECT)
        break
      case SCREENS.UPLOAD_REVIEW:
        setCurrentScreen(SCREENS.UPLOAD_FILES_SELECTED)
        break
      default:
        setCurrentScreen(SCREENS.MAIN_CHOICE)
    }
  }
  
  const handleReset = () => {
    setCurrentScreen(SCREENS.MAIN_CHOICE)
    setSuccessType(null)
    setSuccessTitle(null)
    setError(null)
    setSelectedFiles([])
    setSessionId(null)
    setBooks([])
    setUploadResults(null)
  }

  // ========== TBR FORM SUBMISSION ==========
  
  const handleTBRSubmit = async (data) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      await addToTBR(data)
      setSuccessType('tbr')
      setSuccessTitle(data.title)
      setCurrentScreen(SCREENS.SUCCESS)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ========== MANUAL ENTRY SUBMISSION ==========
  
  const handleManualSubmit = async (data) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      await createTitle(data)
      setSuccessType('library')
      setSuccessTitle(data.title)
      setCurrentScreen(SCREENS.SUCCESS)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ========== UPLOAD FLOW (from original UploadPage) ==========

  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files)
    setSelectedFiles(fileArray)
    setCurrentScreen(SCREENS.UPLOAD_FILES_SELECTED)
    setError(null)
  }, [])

  const handleFileDrop = useCallback((e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  const handleSelectDifferent = useCallback(() => {
    setSelectedFiles([])
    setCurrentScreen(SCREENS.UPLOAD_SELECT)
    setError(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    setCurrentScreen(SCREENS.UPLOAD_ANALYZING)
    setAnalyzeProgress(0)
    setError(null)

    try {
      const response = await analyzeUploadedFiles(selectedFiles, (progress) => {
        setAnalyzeProgress(progress)
      })

      setSessionId(response.session_id)
      setBooks(response.books.map(book => ({
        ...book,
        action: book.duplicate ? null : 'new',
        edited: false,
      })))
      setCurrentScreen(SCREENS.UPLOAD_REVIEW)
    } catch (err) {
      setError(err.message)
      setCurrentScreen(SCREENS.UPLOAD_FILES_SELECTED)
    }
  }, [selectedFiles])

  const handleBookUpdate = useCallback((bookId, updates) => {
    setBooks(prev => prev.map(book => 
      book.id === bookId 
        ? { ...book, ...updates, edited: true }
        : book
    ))
  }, [])

  const handleDuplicateAction = useCallback((bookId, action) => {
    setBooks(prev => prev.map(book =>
      book.id === bookId
        ? { ...book, action }
        : book
    ))
  }, [])

  const handleUpload = useCallback(async () => {
    setCurrentScreen(SCREENS.UPLOAD_UPLOADING)
    setUploadProgress(0)
    setError(null)

    const bookActions = books.map(book => {
      const action = book.action || 'new'
      
      if (action === 'skip') {
        return { id: book.id, action: 'skip' }
      }
      
      if (action === 'add_format') {
        return {
          id: book.id,
          action: 'add_format',
          existing_folder: book.duplicate?.existing_folder,
        }
      }
      
      return {
        id: book.id,
        action: action,
        title: book.title,
        author: book.author,
        series: book.series || null,
        series_number: book.series_number || null,
        category: book.category,
        existing_folder: book.duplicate?.existing_folder,
      }
    })

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await finalizeUpload(sessionId, bookActions)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadResults(response)
      
      setTimeout(() => {
        setCurrentScreen(SCREENS.UPLOAD_SUCCESS)
      }, 500)
    } catch (err) {
      setError(err.message)
      setCurrentScreen(SCREENS.UPLOAD_REVIEW)
    }
  }, [books, sessionId])

  const handleCancelUpload = useCallback(() => {
    setShowCancelModal(true)
  }, [])

  const handleConfirmCancel = useCallback(async () => {
    setShowCancelModal(false)
    
    if (sessionId) {
      try {
        await cancelUpload(sessionId)
      } catch (err) {
        console.error('Cancel error:', err)
      }
    }
    
    handleReset()
  }, [sessionId])

  const handleGoToLibrary = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleUploadMore = useCallback(() => {
    setSelectedFiles([])
    setSessionId(null)
    setBooks([])
    setUploadResults(null)
    setError(null)
    setCurrentScreen(SCREENS.UPLOAD_SELECT)
  }, [])

  // ========== COMPUTED VALUES ==========

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1)
  
  const booksToUpload = books.filter(b => b.action !== 'skip').length
  const filesToUpload = books
    .filter(b => b.action !== 'skip')
    .reduce((sum, b) => sum + b.files.length, 0)

  const allDuplicatesResolved = books.every(book => 
    !book.duplicate || book.action !== null
  )

  // ========== HEADER CONFIG ==========

  const getHeaderConfig = () => {
    switch (currentScreen) {
      case SCREENS.MAIN_CHOICE:
        return { title: 'Add', showBack: false }
      case SCREENS.LIBRARY_CHOICE:
        return { title: 'Add to Library', showBack: true }
      case SCREENS.TBR_FORM:
        return { title: 'Add to TBR', showBack: true }
      case SCREENS.MANUAL_FORM:
        return { title: 'Add to Library', showBack: true }
      case SCREENS.UPLOAD_SELECT:
        return { title: 'Upload Ebooks', showBack: true }
      case SCREENS.UPLOAD_FILES_SELECTED:
        return { title: 'Upload Ebooks', showBack: true }
      case SCREENS.UPLOAD_ANALYZING:
        return { title: 'Analyzing...', showBack: false }
      case SCREENS.UPLOAD_REVIEW:
        return { title: `Review (${books.length} books)`, showBack: true }
      case SCREENS.UPLOAD_UPLOADING:
        return { title: 'Uploading...', showBack: false }
      case SCREENS.UPLOAD_SUCCESS:
        return { title: 'Upload Complete', showBack: false }
      case SCREENS.SUCCESS:
        return { title: successType === 'tbr' ? 'Added to TBR' : 'Added to Library', showBack: false }
      default:
        return { title: 'Add', showBack: false }
    }
  }

  const headerConfig = getHeaderConfig()

  // ========== RENDER ==========

  return (
    <div className="text-[#e0e0e0]">
      {/* Page Header */}
      <div className="px-4 md:px-8 py-4 border-b border-gray-700">
        <div className="flex items-center max-w-2xl mx-auto">
          {headerConfig.showBack && (
            <button
              onClick={handleBack}
              className="text-library-accent mr-2 p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center"
            >
              <ArrowLeft />
              <span className="ml-1">Back</span>
            </button>
          )}
          <h1 className="flex-1 text-lg font-semibold text-white">
            {headerConfig.title}
          </h1>
        </div>
      </div>

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
        {/* Choice Screens */}
        {currentScreen === SCREENS.MAIN_CHOICE && (
          <AddChoice onChoice={handleMainChoice} />
        )}

        {currentScreen === SCREENS.LIBRARY_CHOICE && (
          <LibraryChoice onChoice={handleLibraryChoice} />
        )}

        {/* TBR Form */}
        {currentScreen === SCREENS.TBR_FORM && (
          <TBRForm 
            onSubmit={handleTBRSubmit}
            onCancel={handleBack}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Manual Library Entry Form */}
        {currentScreen === SCREENS.MANUAL_FORM && (
          <ManualEntryForm
            onSubmit={handleManualSubmit}
            onCancel={handleBack}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Upload Flow */}
        {currentScreen === SCREENS.UPLOAD_SELECT && (
          <UploadZone
            onFileSelect={handleFileSelect}
            onFileDrop={handleFileDrop}
            fileInputRef={fileInputRef}
          />
        )}

        {currentScreen === SCREENS.UPLOAD_FILES_SELECTED && (
          <FilesSelected
            files={selectedFiles}
            totalSizeMB={totalSizeMB}
            onAnalyze={handleAnalyze}
            onSelectDifferent={handleSelectDifferent}
          />
        )}

        {currentScreen === SCREENS.UPLOAD_ANALYZING && (
          <AnalyzingProgress progress={analyzeProgress} />
        )}

        {currentScreen === SCREENS.UPLOAD_REVIEW && (
          <ReviewBooks
            books={books}
            onBookUpdate={handleBookUpdate}
            onDuplicateAction={handleDuplicateAction}
            onUpload={handleUpload}
            onCancel={handleCancelUpload}
            booksToUpload={booksToUpload}
            filesToUpload={filesToUpload}
            canUpload={allDuplicatesResolved}
          />
        )}

        {currentScreen === SCREENS.UPLOAD_UPLOADING && (
          <UploadProgress
            books={books}
            progress={uploadProgress}
          />
        )}

        {currentScreen === SCREENS.UPLOAD_SUCCESS && (
          <UploadSuccess
            results={uploadResults}
            books={books}
            onGoToLibrary={handleGoToLibrary}
            onUploadMore={handleUploadMore}
          />
        )}

        {/* Success Screen (for TBR and Manual) */}
        {currentScreen === SCREENS.SUCCESS && (
          <AddSuccess
            type={successType}
            title={successTitle}
            onAddAnother={handleReset}
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
  )
}

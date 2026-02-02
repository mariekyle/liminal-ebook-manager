/**
 * AddPage.jsx
 * 
 * Main "Add" page that routes between:
 * - Initial choice (owned vs wishlist)
 * - Owned: add to library (upload or manual entry)
 * - Wishlist: entry form
 * 
 * Supports deep linking:
 * - /add → initial choice
 * - /add?mode=wishlist → skip to wishlist form
 * - /add?mode=library → skip to add to library
 * - /add?mode=upload → skip to add to library
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { analyzeUploadedFiles, finalizeUpload, cancelUpload, addToTBR, createTitle, createEdition, getBook, linkFilesToTitle } from '../api'
import UnifiedNavBar from '../components/UnifiedNavBar'

// Choice screens
import AddChoice from '../components/add/AddChoice'

// Form screens
import WishlistForm from '../components/add/WishlistForm'
import ManualEntryForm from '../components/add/ManualEntryForm'
import AddSuccess from '../components/add/AddSuccess'

// Unified add component
import AddToLibrary from '../components/add/AddToLibrary'

// Upload flow components
import ReviewBooks from '../components/upload/ReviewBooks'
import UploadProgress from '../components/upload/UploadProgress'
import UploadSuccess from '../components/upload/UploadSuccess'
import CancelModal from '../components/upload/CancelModal'

// Screen constants
const SCREENS = {
  // Choice screens
  MAIN_CHOICE: 'main_choice',
  
  // Wishlist flow
  WISHLIST_FORM: 'wishlist_form',
  
  // Manual library entry
  MANUAL_FORM: 'manual_form',
  
  // Digital files flow (consolidated)
  ADD_TO_LIBRARY: 'add_to_library',
  UPLOAD_REVIEW: 'upload_review',
  UPLOAD_UPLOADING: 'upload_uploading',
  UPLOAD_SUCCESS: 'upload_success',
  
  // Shared
  SUCCESS: 'success',
}

export default function AddPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Determine initial screen based on URL params
  const getInitialScreen = () => {
    const mode = searchParams.get('mode')
    if (mode === 'tbr') return SCREENS.WISHLIST_FORM
    if (mode === 'wishlist') return SCREENS.WISHLIST_FORM
    if (mode === 'library') return SCREENS.ADD_TO_LIBRARY
    if (mode === 'upload') return SCREENS.ADD_TO_LIBRARY
    return SCREENS.MAIN_CHOICE
  }
  
  // Screen state
  const [currentScreen, setCurrentScreen] = useState(getInitialScreen)
  
  // Link to existing title (TBR → Library with ebook upload)
  const linkToId = searchParams.get('linkTo')
  const [linkedBook, setLinkedBook] = useState(null)
  
  // Fetch linked book info if linkTo param present
  useEffect(() => {
    if (linkToId) {
      getBook(linkToId)
        .then(book => setLinkedBook(book))
        .catch(err => console.error('Failed to fetch linked book:', err))
    }
  }, [linkToId])
  
  // Success state
  const [successType, setSuccessType] = useState(null) // 'wishlist' or 'library'
  const [successTitle, setSuccessTitle] = useState(null)
  const [successTitleId, setSuccessTitleId] = useState(null)
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Manual entry format choice
  const [manualEntryFormat, setManualEntryFormat] = useState('physical')
  
  // ========== UPLOAD STATE (from original UploadPage) ==========
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [sessionId, setSessionId] = useState(null)
  const [books, setBooks] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // ========== NAVIGATION ==========
  
  const handleMainChoice = (choice) => {
    if (choice === 'wishlist') {
      setCurrentScreen(SCREENS.WISHLIST_FORM)
    } else {
      setCurrentScreen(SCREENS.ADD_TO_LIBRARY)
    }
  }
  
  const handleBack = () => {
    // If in link mode, back goes to book detail
    if (linkToId && currentScreen === SCREENS.ADD_TO_LIBRARY) {
      navigate(`/book/${linkToId}`)
      return
    }
    
    switch (currentScreen) {
      case SCREENS.WISHLIST_FORM:
        setCurrentScreen(SCREENS.MAIN_CHOICE)
        break
      case SCREENS.ADD_TO_LIBRARY:
        setCurrentScreen(SCREENS.MAIN_CHOICE)
        break
      case SCREENS.MANUAL_FORM:
        setCurrentScreen(SCREENS.ADD_TO_LIBRARY)
        break
      case SCREENS.UPLOAD_REVIEW:
        setCurrentScreen(SCREENS.ADD_TO_LIBRARY)
        break
      default:
        setCurrentScreen(SCREENS.MAIN_CHOICE)
    }
  }
  
  const handleReset = () => {
    setCurrentScreen(SCREENS.MAIN_CHOICE)
    setSuccessType(null)
    setSuccessTitle(null)
    setSuccessTitleId(null)
    setError(null)
    setSelectedFiles([])
    setIsAnalyzing(false)
    setSessionId(null)
    setBooks([])
    setUploadResults(null)
    setManualEntryFormat('physical')
  }

  // ========== TBR FORM SUBMISSION ==========
  
  const handleWishlistSubmit = async (data) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      await addToTBR(data)  // API function name unchanged
      setSuccessType('wishlist')
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
      let titleId
      
      if (data.existingTitleId) {
        // Adding format to existing title
        await createEdition(data.existingTitleId, {
          format: data.format,
          acquired_date: new Date().toISOString().split('T')[0], // Today's date
        })
        titleId = data.existingTitleId
      } else {
        // Creating new title
        const response = await createTitle(data)
        titleId = response.id || response.title_id || null
      }
      
      setSuccessType('library')
      setSuccessTitle(data.title)
      setSuccessTitleId(titleId)
      setCurrentScreen(SCREENS.SUCCESS)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ========== UPLOAD FLOW (from original UploadPage) ==========

  // Handler for AddToLibrary component
  const handleFilesChange = useCallback((files) => {
    setSelectedFiles(files)
    setError(null)
  }, [])

  // Handler for manual entry format selection
  const handleManualEntryFromAdd = useCallback((format) => {
    setError(null)
    // Map format from AddToLibrary to ManualEntryForm values
    const formatMap = {
      'physical': 'physical',
      'audiobook': 'audiobook',
      'web_url': 'web',
    }
    setManualEntryFormat(formatMap[format] || 'physical')
    setCurrentScreen(SCREENS.MANUAL_FORM)
  }, [])

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true)
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
      
      setIsAnalyzing(false)
      
      // In link mode, skip review and go straight to upload
      if (linkToId) {
        // Trigger upload immediately
        setCurrentScreen(SCREENS.UPLOAD_UPLOADING)
        setUploadProgress(0)
        
        let progressInterval = null
        
        try {
          progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90))
          }, 500)

          await linkFilesToTitle(response.session_id, linkToId)
          
          clearInterval(progressInterval)
          setUploadProgress(100)
          
          // Include linked book info for success screen display
          setBooks([{
            id: linkToId,
            title: linkedBook?.title || 'Unknown',
            author: linkedBook?.authors?.join(', ') || 'Unknown',
            files: selectedFiles.map(f => ({ name: f.name, size: f.size })),
            action: 'add_to_existing',
          }])
          setUploadResults({
            results: [{ id: linkToId, status: 'format_added' }]
          })
          
          setTimeout(() => {
            setCurrentScreen(SCREENS.UPLOAD_SUCCESS)
          }, 500)
        } catch (err) {
          if (progressInterval) clearInterval(progressInterval)
          setError(err.message)
          setIsAnalyzing(false)
          setCurrentScreen(SCREENS.ADD_TO_LIBRARY)  // Return to recoverable state
        }
        return
      } else {
        setCurrentScreen(SCREENS.UPLOAD_REVIEW)
      }
    } catch (err) {
      setError(err.message)
      setIsAnalyzing(false)
    }
  }, [selectedFiles, linkToId, linkedBook, navigate])

  const handleBookUpdate = useCallback((bookId, updates) => {
    setBooks(prev => prev.map(book => 
      book.id === bookId 
        ? { ...book, ...updates, edited: true }
        : book
    ))
  }, [])

  const handleDuplicateAction = useCallback((bookId, action, extraData = null) => {
    setBooks(prev => prev.map(book =>
      book.id === bookId
        ? { ...book, action, actionData: extraData }
        : book
    ))
  }, [])

  const handleUpload = useCallback(async () => {
    setCurrentScreen(SCREENS.UPLOAD_UPLOADING)
    setUploadProgress(0)
    setError(null)

    // Normal upload flow (creating new books)
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
      
      // Handle add_to_existing (from familiar title detection)
      if (action === 'add_to_existing') {
        return {
          id: book.id,
          action: 'add_to_existing',
          title_id: book.actionData?.title_id || book.familiar_title?.title_id,
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
    setIsAnalyzing(false)
    setSessionId(null)
    setBooks([])
    setUploadResults(null)
    setError(null)
    setCurrentScreen(SCREENS.ADD_TO_LIBRARY)
  }, [])

  // ========== COMPUTED VALUES ==========
  
  const booksToUpload = books.filter(b => b.action !== 'skip').length
  const filesToUpload = books
    .filter(b => b.action !== 'skip')
    .reduce((sum, b) => sum + b.files.length, 0)

  const allDuplicatesResolved = books.every(book => 
    // No duplicate or familiar match, OR has an action chosen
    (!book.duplicate && !book.familiar_title) || book.action !== null
  )

  // ========== HEADER CONFIG ==========

  const getHeaderConfig = () => {
    // Special headers for link mode
    if (linkToId && linkedBook) {
      switch (currentScreen) {
        case SCREENS.ADD_TO_LIBRARY:
          return { title: 'Add Files', showBack: true }
        case SCREENS.UPLOAD_REVIEW:
          return { title: 'Review Files', showBack: true }
        case SCREENS.UPLOAD_UPLOADING:
          return { title: 'Adding...', showBack: false }
      }
    }
    
    switch (currentScreen) {
      case SCREENS.MAIN_CHOICE:
        return { title: '', showBack: false }
      case SCREENS.WISHLIST_FORM:
        return { title: 'Save to Wishlist', showBack: true }
      case SCREENS.MANUAL_FORM:
        return { title: 'Add to Library', showBack: true }
      case SCREENS.ADD_TO_LIBRARY:
        return { title: 'Add to Library', showBack: true }
      case SCREENS.UPLOAD_REVIEW:
        return { title: `Review ${books.length} ${books.length === 1 ? 'story' : 'stories'}`, showBack: true }
      case SCREENS.UPLOAD_UPLOADING:
        return { title: 'Adding...', showBack: false }
      case SCREENS.UPLOAD_SUCCESS:
        return { title: 'Added to Library', showBack: false }
      case SCREENS.SUCCESS:
        return { title: successType === 'wishlist' ? 'Saved to Wishlist' : 'Added to Library', showBack: false }
      default:
        return { title: 'Add', showBack: false }
    }
  }

  const headerConfig = getHeaderConfig()

  // ========== RENDER ==========

  // Show nav bar for screens that have back navigation
  const showNavBar = headerConfig.showBack

  return (
    <div className="text-[#e0e0e0]">
      {/* Page Header - sticky nav with multi-step back */}
      {showNavBar && (
        <UnifiedNavBar backLabel="Back" onBack={handleBack} />
      )}

      {/* Screen title - shown below nav bar when there's a title */}
      {headerConfig.title && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <h1 className="text-lg font-semibold text-white">{headerConfig.title}</h1>
        </div>
      )}

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

        {/* Wishlist Form */}
        {currentScreen === SCREENS.WISHLIST_FORM && (
          <WishlistForm 
            onSubmit={handleWishlistSubmit}
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
            initialFormat={manualEntryFormat}
          />
        )}

        {/* Add to Library (unified file selection) */}
        {currentScreen === SCREENS.ADD_TO_LIBRARY && (
          <>
            {/* Context banner when uploading for a linked wishlist book */}
            {linkedBook && (
              <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">📚</span>
                  <span className="text-green-300 font-medium">Adding files for:</span>
                </div>
                <p className="text-white font-semibold">{linkedBook.title}</p>
                <p className="text-gray-400 text-sm">by {linkedBook.authors?.join(', ')}</p>
              </div>
            )}
            <AddToLibrary
              files={selectedFiles}
              onFilesChange={handleFilesChange}
              onContinue={handleAnalyze}
              onManualEntry={handleManualEntryFromAdd}
              isAnalyzing={isAnalyzing}
              analyzeProgress={analyzeProgress}
            />
          </>
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

        {/* Success Screen (for Wishlist and Manual) */}
        {currentScreen === SCREENS.SUCCESS && (
          <AddSuccess
            type={successType}
            title={successTitle}
            titleId={successTitleId}
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

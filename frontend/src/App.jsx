import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import Header from './components/layout/Header';
import Library from './pages/Library';
import BookDetailPage from './pages/BookDetailPage';
import Settings from './pages/Settings';
import NotificationToast from './components/common/NotificationToast';
import Loading from './components/common/Loading';
import './App.css';

// Main app component that uses the context
const AppContent = () => {
  const { state, actions, computed } = useApp();
  const { actions: notificationActions } = useNotifications();
  const { settings } = useSettings();

  // Load books on mount
  useEffect(() => {
    actions.fetchBooks();
  }, []);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!settings.autoRefresh || !settings.autoRefreshInterval) return;

    const interval = setInterval(() => {
      actions.fetchBooks(state.searchQuery);
    }, settings.autoRefreshInterval);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.autoRefreshInterval, state.searchQuery]);

  // Show error notifications
  useEffect(() => {
    if (state.error) {
      notificationActions.showError(state.error);
    }
  }, [state.error, notificationActions]);

  const handleSearchChange = (query) => {
    actions.setSearchQuery(query);
    actions.fetchBooks(query);
  };

  const handleUpload = async (file) => {
    const result = await actions.uploadBook(file);
    
    if (result.success) {
      notificationActions.showSuccess('Book uploaded successfully!');
    } else {
      notificationActions.showError(`Upload failed: ${result.error}`);
    }
  };

  const handleSelectBook = (book) => {
    actions.setSelectedBook(book);
  };

  const handleBackToLibrary = () => {
    actions.setSelectedBook(null);
  };

  const handleUpdateBook = async (bookId, formData, coverFile) => {
    const result = await actions.updateBook(bookId, formData, coverFile);
    
    if (result.success) {
      notificationActions.showSuccess('Book updated successfully!');
    } else {
      notificationActions.showError(`Update failed: ${result.error}`);
    }
    
    return result;
  };

  const handleDeleteBook = async (bookId) => {
    const result = await actions.deleteBook(bookId);
    
    if (result.success) {
      notificationActions.showSuccess('Book deleted!');
    } else {
      notificationActions.showError(`Delete failed: ${result.error}`);
    }
    
    return result;
  };

  const handleDownloadBook = async (bookId) => {
    const result = await actions.downloadBook(bookId);
    
    if (!result.success) {
      notificationActions.showError(`Download failed: ${result.error}`);
    }
    
    return result;
  };

  const handleSettingsClick = () => {
    actions.setView('settings');
  };

  const handleBackFromSettings = () => {
    actions.setView('library');
  };

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${settings.theme}`;
  }, [settings.theme]);

  if (state.loading && state.books.length === 0) {
    return <Loading fullScreen text="Loading your library..." />;
  }

  return (
    <div className={`app theme-${settings.theme}`}>
      <Header
        searchQuery={state.searchQuery}
        onSearchChange={handleSearchChange}
        onUpload={handleUpload}
        uploading={state.uploading}
        onSettingsClick={handleSettingsClick}
      />
      
      <main className="main-content">
        {state.view === 'settings' ? (
          <Settings onBack={handleBackFromSettings} />
        ) : state.selectedBook ? (
          <BookDetailPage
            book={state.selectedBook}
            onBack={handleBackToLibrary}
            onUpdateBook={handleUpdateBook}
            onDelete={handleDeleteBook}
            onDownload={handleDownloadBook}
          />
        ) : (
          <Library
            books={computed.displayBooks()}
            loading={state.loading}
            onSelectBook={handleSelectBook}
            sortBy={state.sortBy}
            onSortChange={actions.setSortBy}
          />
        )}
      </main>
      
      <NotificationToast />
    </div>
  );
};

// Root app component with providers
function App() {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </NotificationProvider>
    </SettingsProvider>
  );
}

export default App; 
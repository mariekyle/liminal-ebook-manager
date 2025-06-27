import React, { useState, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../common/Button';

const Header = ({ 
  searchQuery = '', 
  onSearchChange, 
  onUpload, 
  uploading = false,
  onSettingsClick 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { settings, actions } = useSettings();
  const { actions: notificationActions } = useNotifications();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file type
    const allowedTypes = settings.allowedFileTypes;
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      notificationActions.showError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      );
      return;
    }

    // Validate file size
    const maxSizeMB = settings.maxFileSize;
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > maxSizeMB) {
      notificationActions.showError(
        `File too large. Maximum size: ${maxSizeMB}MB`
      );
      return;
    }

    try {
      await onUpload(file);
      notificationActions.showSuccess(`${file.name} uploaded successfully!`);
    } catch (error) {
      notificationActions.showError(`Upload failed: ${error.message}`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    onSearchChange(query);
    
    // Add to search history if it's a meaningful search
    if (query.trim().length > 2) {
      actions.addSearchHistory(query.trim());
    }
  };

  const handleThemeToggle = () => {
    actions.toggleTheme();
    notificationActions.showInfo(
      `Switched to ${settings.theme === 'light' ? 'dark' : 'light'} theme`
    );
  };

  return (
    <header className={`app-header ${dragOver ? 'drag-over' : ''}`}>
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">Liminal eBook Manager</h1>
        </div>
        
        <div className="header-center">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search books by title, author, or tags..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="search-input"
            />
            <div className="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <Button
            variant="outline"
            size="small"
            onClick={handleThemeToggle}
            title={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {settings.theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="small"
            onClick={onSettingsClick}
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Button>
          
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload eBook"
          >
            {uploading ? (
              <>
                <div className="btn-spinner"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Upload eBook
              </>
            )}
          </Button>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div
        className="drag-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="drag-drop-overlay">
            <div className="drag-drop-message">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <p>Drop your eBook here to upload</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 
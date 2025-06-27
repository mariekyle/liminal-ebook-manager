import React from 'react';
import Button from '../common/Button';

const Header = ({ 
  searchQuery, 
  onSearchChange, 
  onUpload, 
  uploading = false 
}) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="app-title">Liminal</div>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="upload-section">
          <input
            type="file"
            accept=".epub"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUpload(e.target.files[0]);
              }
            }}
            disabled={uploading}
            id="file-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload">
            <Button 
              variant="primary" 
              disabled={uploading}
              loading={uploading}
              className="upload-btn"
            >
              {uploading ? 'Uploading...' : 'Upload EPUB'}
            </Button>
          </label>
        </div>
      </div>
    </header>
  );
};

export default Header; 
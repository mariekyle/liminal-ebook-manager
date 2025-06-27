import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { validateRequired, validateTag } from '../../utils/validators';

const BookForm = ({ book, onSave, onCancel, onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    series: '',
    series_number: '',
    tags: [],
    newTag: ''
  });
  const [newCoverFile, setNewCoverFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        series: book.series || '',
        series_number: book.series_number || '',
        tags: book.tags ? book.tags.split(',').map(tag => tag.trim()) : [],
        newTag: ''
      });
    }
  }, [book]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!validateRequired(formData.title)) {
      newErrors.title = 'Title is required';
    }
    
    if (!validateRequired(formData.author)) {
      newErrors.author = 'Author is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData, newCoverFile);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = formData.newTag.trim();
    
    if (!validateTag(tag)) {
      setErrors({ ...errors, newTag: 'Tag must be between 1 and 50 characters' });
      return;
    }

    if (formData.tags.includes(tag)) {
      setErrors({ ...errors, newTag: 'Tag already exists' });
      return;
    }

    setFormData({
      ...formData,
      tags: [...formData.tags, tag],
      newTag: ''
    });
    setErrors({ ...errors, newTag: '' });
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="edit-book-container">
      <div className="edit-book-header">
        <h2>Edit Book</h2>
        <Button variant="secondary" onClick={onBack}>
          ← Back to Library
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="edit-book-body">
        <div className="edit-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`form-input ${errors.title ? 'form-input-error' : ''}`}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="author">Author *</label>
            <input
              id="author"
              type="text"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              className={`form-input ${errors.author ? 'form-input-error' : ''}`}
            />
            {errors.author && <span className="error-message">{errors.author}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="form-textarea"
              rows="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="series">Series</label>
            <input
              id="series"
              type="text"
              value={formData.series}
              onChange={(e) => handleInputChange('series', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="series_number">Series Number</label>
            <input
              id="series_number"
              type="text"
              value={formData.series_number}
              onChange={(e) => handleInputChange('series_number', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-container">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag-badge">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="remove-tag-btn"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="add-tag-container">
              <input
                type="text"
                value={formData.newTag}
                onChange={(e) => handleInputChange('newTag', e.target.value)}
                placeholder="Add new tag"
                className={`form-input ${errors.newTag ? 'form-input-error' : ''}`}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="small"
                onClick={handleAddTag}
              >
                Add Tag
              </Button>
            </div>
            {errors.newTag && <span className="error-message">{errors.newTag}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="cover-upload">Cover Image</label>
            <label htmlFor="cover-upload" className="custom-file-upload">
              Choose File
            </label>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setNewCoverFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
            {newCoverFile && <span className="file-name">{newCoverFile.name}</span>}
          </div>

          <div className="form-actions">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
        
        <div className="edit-book-preview">
          {book?.cover_path && (
            <img src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/${book.cover_path}`} alt={`Cover for ${book.title}`} />
          )}
        </div>
      </form>
    </div>
  );
};

export default BookForm; 
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Library.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Library() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/v1/books`)
      if (!response.ok) {
        throw new Error('Failed to fetch books')
      }
      const data = await response.json()
      setBooks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.epub')) {
      setError('Only EPUB files are supported')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/api/v1/books/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Refresh the book list
      await fetchBooks()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return <div className="loading">Loading your library...</div>
  }

  return (
    <div className="library">
      <div className="library-header">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="upload-section">
          <label htmlFor="file-upload" className="btn btn-primary">
            {uploading ? 'Uploading...' : '📤 Upload EPUB'}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".epub"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="books-grid">
        {filteredBooks.length === 0 ? (
          <div className="empty-state">
            <h3>No books found</h3>
            <p>Upload your first EPUB file to get started!</p>
          </div>
        ) : (
          filteredBooks.map(book => (
            <div key={book.id} className="book-card">
              <div className="book-cover">
                <span className="book-icon">📖</span>
              </div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{book.author || 'Unknown Author'}</p>
                <p className="book-size">
                  {(book.file_size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <div className="book-actions">
                <Link to={`/book/${book.id}`} className="btn btn-primary">
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Library 
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './BookDetail.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: ''
  })

  useEffect(() => {
    fetchBook()
  }, [id])

  const fetchBook = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/v1/books/${id}`)
      if (!response.ok) {
        throw new Error('Book not found')
      }
      const data = await response.json()
      setBook(data)
      setFormData({
        title: data.title,
        author: data.author || '',
        description: data.description || ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update book')
      }

      const updatedBook = await response.json()
      setBook(updatedBook)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/books/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete book')
      }

      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="loading">Loading book details...</div>
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Back to Library
        </button>
      </div>
    )
  }

  if (!book) {
    return <div className="error">Book not found</div>
  }

  return (
    <div className="book-detail">
      <div className="book-detail-header">
        <button onClick={() => navigate('/')} className="btn btn-primary">
          ← Back to Library
        </button>
        <div className="book-actions">
          {!editing && (
            <>
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="book-content">
        <div className="book-cover-large">
          <span className="book-icon-large">📖</span>
        </div>

        <div className="book-info-detail">
          {editing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button onClick={handleUpdate} className="btn btn-primary">
                  Save Changes
                </button>
                <button onClick={() => setEditing(false)} className="btn">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="book-details">
              <h1>{book.title}</h1>
              <p className="book-author-detail">
                by {book.author || 'Unknown Author'}
              </p>
              {book.description && (
                <div className="book-description">
                  <h3>Description</h3>
                  <p>{book.description}</p>
                </div>
              )}
              <div className="book-meta">
                <p><strong>File Size:</strong> {(book.file_size / 1024 / 1024).toFixed(1)} MB</p>
                <p><strong>Added:</strong> {new Date(book.added_date).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookDetail 
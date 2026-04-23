/**
 * AddChoice.jsx
 *
 * Initial choice screen: Add to Library vs Add to Wishlist
 * Session 9: Added dynamic book count subtitle
 */

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import { listBooks } from '../../api'

export default function AddChoice({ onChoice }) {
  const [bookCount, setBookCount] = useState(null)

  useEffect(() => {
    listBooks({ limit: 1, acquisition: 'all' })
      .then(data => {
        setBookCount(data.total ?? data.totalBooks ?? data.books?.length ?? null)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-h2 mb-2 text-center">What would you like to add?</h1>

      {bookCount !== null && (
        <p className="text-body-sm text-text-secondary mb-8 text-center">
          {bookCount.toLocaleString()} titles and counting
        </p>
      )}
      {bookCount === null && <div className="mb-8" />}

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button variant="primary" size="lg" className="w-full" onClick={() => onChoice('library')}>
          Add to Library
        </Button>

        <Button variant="secondary" size="lg" className="w-full" onClick={() => onChoice('wishlist')}>
          Add to Wishlist
        </Button>
      </div>
    </div>
  )
}

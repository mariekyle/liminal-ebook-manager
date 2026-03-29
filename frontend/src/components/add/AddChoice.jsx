/**
 * AddChoice.jsx
 *
 * Initial choice screen: Add to Library vs Add to Wishlist
 */

import Button from '../ui/Button'

export default function AddChoice({ onChoice }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-bg-base">
      <h1 className="text-h2 mb-8 text-center">What would you like to add?</h1>

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

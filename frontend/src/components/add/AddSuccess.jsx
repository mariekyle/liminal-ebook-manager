/**
 * AddSuccess.jsx
 *
 * Success screen shown after successfully adding a book
 */

import { useNavigate } from 'react-router-dom'
import StepIndicator from './StepIndicator'
import Button from '../ui/Button'

export default function AddSuccess({ type, title, titleId, onAddAnother }) {
  const navigate = useNavigate()

  const isWishlist = type === 'wishlist'
  const canViewStory = !isWishlist && titleId

  return (
    <div className="py-6">
      <StepIndicator steps={['Add', 'Done']} currentStep={1} />

      <div className="py-6 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">✨</div>

        <h1 className="text-h4 text-text-primary mb-1">
          {isWishlist ? 'Saved to your wishlist' : 'Added to your library'}
        </h1>

        <p className="text-body-sm text-text-secondary mb-2">
          {isWishlist ? 'A promise to your future self' : 'Your collection grows'}
        </p>

        {title && <p className="text-caption text-text-muted mb-6 italic">&quot;{title}&quot;</p>}

        <div className="flex gap-3 flex-wrap justify-center">
          <Button type="button" variant="secondary" onClick={onAddAnother}>
            Add Another
          </Button>
          {canViewStory ? (
            <Button type="button" variant="primary" onClick={() => navigate(`/book/${titleId}`)}>
              View Story
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(isWishlist ? '/?acquisition=wishlist' : '/')}
            >
              {isWishlist ? 'View Wishlist' : 'View Library'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

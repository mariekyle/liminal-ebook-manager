/**
 * AddSuccess.jsx
 * 
 * Success screen shown after successfully adding a book
 */

import { useNavigate } from 'react-router-dom'

export default function AddSuccess({ type, title, onAddAnother }) {
  const navigate = useNavigate()
  
  const isTBR = type === 'tbr'
  
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4">✨</div>
      
      <h2 className="text-xl font-semibold text-white mb-2">
        {isTBR ? 'Added to your TBR!' : 'Added to your Library!'}
      </h2>
      
      <p className="text-gray-400 mb-2">
        {isTBR 
          ? 'A promise to your future self, saved.'
          : 'Your collection grows.'}
      </p>
      
      {title && (
        <p className="text-gray-500 text-sm mb-6 italic">"{title}"</p>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={onAddAnother}
          className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Add Another
        </button>
        <button
          onClick={() => navigate(isTBR ? '/tbr' : '/')}
          className="bg-library-accent text-white px-6 py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          {isTBR ? 'View TBR' : 'View Library'}
        </button>
      </div>
    </div>
  )
}

/**
 * AddChoice.jsx
 * 
 * Initial choice screen: Add to Library vs Add to Wishlist
 * Clean, centered design
 */

export default function AddChoice({ onChoice }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-white mb-8">What would you like to add?</h1>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onChoice('library')}
          className="w-full py-4 px-6 rounded-xl bg-library-accent text-white font-medium text-lg hover:opacity-90 transition-opacity"
        >
          Add to Library
        </button>
        
        <button
          onClick={() => onChoice('wishlist')}
          className="w-full py-4 px-6 rounded-xl bg-gray-700 text-white font-medium text-lg hover:bg-gray-600 transition-colors"
        >
          Add to Wishlist
        </button>
      </div>
    </div>
  )
}

/**
 * AddChoice.jsx
 * 
 * Initial choice screen: "A book I have" vs "A future read"
 */

// Icons
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

function ChoiceCard({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-5 rounded-xl border-2 border-gray-700 bg-gray-800/50 hover:border-library-accent hover:bg-library-accent/10 transition-all text-left flex items-center gap-4"
    >
      <div className="text-gray-400">{icon}</div>
      <div>
        <div className="text-white font-medium text-lg">{title}</div>
        <div className="text-gray-400 text-sm">{subtitle}</div>
      </div>
    </button>
  )
}

export default function AddChoice({ onChoice }) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">What would you like to add?</h1>
      </div>
      
      <div className="space-y-4 max-w-md mx-auto">
        <ChoiceCard
          icon={<BookIcon />}
          title="I have this"
          subtitle="Add to my library"
          onClick={() => onChoice('library')}
        />
        <ChoiceCard
          icon={<BookmarkIcon />}
          title="Something to read someday"
          subtitle="Save to wishlist"
          onClick={() => onChoice('wishlist')}
        />
      </div>
    </div>
  )
}

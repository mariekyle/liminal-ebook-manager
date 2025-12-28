/**
 * LibraryChoice.jsx
 * 
 * Choice screen for library additions: "Ebook files" vs "Other format"
 */

// Icons
const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

const PackageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
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

export default function LibraryChoice({ onChoice }) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Add to Library</h1>
        <p className="text-gray-400">What format is it in?</p>
      </div>
      
      <div className="space-y-4 max-w-md mx-auto">
        <ChoiceCard
          icon={<FileIcon />}
          title="Digital files"
          subtitle="Upload .epub, .mobi, .pdf, etc."
          onClick={() => onChoice('ebook')}
        />
        <ChoiceCard
          icon={<PackageIcon />}
          title="Another format"
          subtitle="Physical, audiobook, or web-based"
          onClick={() => onChoice('manual')}
        />
      </div>
    </div>
  )
}

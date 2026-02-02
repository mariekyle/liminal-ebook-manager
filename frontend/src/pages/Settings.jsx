import { Link } from 'react-router-dom'

export default function Settings() {
  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header - Title only, no back link */}
      <div className="sticky top-0 z-10 bg-bg-primary border-b border-border-subtle">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Placeholder - will be expanded later */}
        <div className="text-text-secondary text-sm">
          Settings page coming soon. For now, use the gear icon in the Library header.
        </div>
        
        {/* Quick link back to library */}
        <Link 
          to="/"
          className="text-accent-teal text-sm hover:underline"
        >
          ← Back to Library
        </Link>
      </div>
    </div>
  )
}

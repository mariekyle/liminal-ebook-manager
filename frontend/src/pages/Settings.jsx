import { Link } from 'react-router-dom'
import UnifiedNavBar from '../components/UnifiedNavBar'

export default function Settings() {
  return (
    <div className="min-h-screen bg-library-bg pb-20">
      {/* Header - Title only variant */}
      <UnifiedNavBar title="Settings" />

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Placeholder - will be expanded later */}
        <div className="text-gray-400 text-sm">
          Settings page coming soon. For now, use the gear icon in the Library header.
        </div>
        
        {/* Quick link back to library */}
        <Link 
          to="/"
          className="text-library-accent text-sm hover:underline"
        >
          ← Back to Library
        </Link>
      </div>
    </div>
  )
}

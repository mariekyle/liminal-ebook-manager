import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import SettingsDrawer from './SettingsDrawer'

// Icons for desktop nav
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const StackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const navItems = [
  { to: '/', label: 'Library', icon: BookIcon, match: 'library' },
  { to: '/?view=series', label: 'Series', icon: StackIcon, match: 'series' },
  { to: '/authors', label: 'Authors', icon: UserIcon, match: 'authors' },
  { to: '/tbr', label: 'TBR', icon: BookmarkIcon, match: 'tbr' },
  { to: '/add', label: 'Add', icon: PlusIcon, match: 'add' },
]

function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()

  const isActive = (item) => {
    if (item.match === 'library') {
      return location.pathname === '/' && !location.search.includes('view=series')
    }
    if (item.match === 'series') {
      return location.pathname === '/' && location.search.includes('view=series')
    }
    if (item.match === 'authors') {
      return location.pathname === '/authors' || location.pathname.startsWith('/author/')
    }
    if (item.match === 'tbr') {
      return location.pathname === '/tbr'
    }
    if (item.match === 'add') {
      return location.pathname === '/add' || location.pathname === '/upload'
    }
    return false
  }

  return (
    <>
      <header className="bg-library-card border-b border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          {/* Logo */}
          <NavLink to="/" className="text-xl font-bold text-white">
            Liminal
          </NavLink>
          
          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, match }) => (
              <NavLink
                key={match}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive({ match })
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
          
          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-gray-400 hover:text-white p-2"
            aria-label="Open settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <SettingsDrawer 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </>
  )
}

export default Header

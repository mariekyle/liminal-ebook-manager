import { NavLink, useLocation } from 'react-router-dom'

// Icons
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const StackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const navItems = [
  { to: '/', label: 'Library', icon: BookIcon, match: 'library' },
  { to: '/?view=series', label: 'Series', icon: StackIcon, match: 'series' },
  { to: '/authors', label: 'Authors', icon: UserIcon, match: 'authors' },
  { to: '/upload', label: 'Upload', icon: PlusIcon, match: 'upload' },
]

function BottomNav() {
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
    if (item.match === 'upload') {
      return location.pathname === '/upload'
    }
    return false
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-library-card border-t border-gray-700 z-40 md:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon, match }) => (
          <NavLink
            key={match}
            to={to}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              isActive({ match }) 
                ? 'text-library-accent' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon />
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav


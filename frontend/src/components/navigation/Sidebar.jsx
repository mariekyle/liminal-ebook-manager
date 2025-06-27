import React, { useState, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { navigationMenu } from '../../config/routes';
import { 
  Home, 
  BookOpen, 
  Upload, 
  User, 
  Settings, 
  Users, 
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import '../../styles/navigation.css';

const Sidebar = ({ isOpen, onToggle }) => {
  const { user } = useContext(AppContext);
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({});

  const iconMap = {
    Home,
    BookOpen,
    Upload,
    User,
    Settings,
    Users,
    BarChart3
  };

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const hasPermission = (permission) => {
    if (!permission) return true;
    return user?.permissions?.includes(permission) || user?.role === 'admin';
  };

  const isAdmin = user?.role === 'admin';

  const renderMenuItem = (item) => {
    // Check permission
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    // Check admin requirement
    if (item.admin && !isAdmin) {
      return null;
    }

    const IconComponent = iconMap[item.icon];
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) => 
          `sidebar-menu-item ${isActive ? 'active' : ''}`
        }
        onClick={() => onToggle && onToggle()}
      >
        {IconComponent && <IconComponent size={20} />}
        <span>{item.title}</span>
      </NavLink>
    );
  };

  const renderSection = (section) => {
    // Check if section should be shown
    if (section.admin && !isAdmin) {
      return null;
    }

    const hasVisibleItems = section.items.some(item => {
      if (item.permission && !hasPermission(item.permission)) return false;
      if (item.admin && !isAdmin) return false;
      return true;
    });

    if (!hasVisibleItems) {
      return null;
    }

    const isExpanded = expandedSections[section.title];

    return (
      <div key={section.title} className="sidebar-section">
        <button
          className="sidebar-section-header"
          onClick={() => toggleSection(section.title)}
        >
          <span>{section.title}</span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {isExpanded && (
          <div className="sidebar-section-items">
            {section.items.map(renderMenuItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => onToggle && onToggle()}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Mobile header */}
        <div className="sidebar-mobile-header">
          <h2>Liminal</h2>
          <button 
            className="sidebar-close-btn"
            onClick={() => onToggle && onToggle()}
          >
            <X size={24} />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="sidebar-user-info">
            <div className="user-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name || user.username} />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="user-details">
              <h3>{user.display_name || user.username}</h3>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        )}

        {/* Navigation menu */}
        <nav className="sidebar-nav">
          {navigationMenu.map(renderSection)}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-version">
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 
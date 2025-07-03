import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../types/roles';

const RoleBasedNav: React.FC = () => {
  const { isAuthenticated, user, isAdmin, isPremium } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <nav className="space-y-2">
      {/* Basic navigation for all authenticated users */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Library
        </h3>
        <Link 
          to="/library" 
          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          My Books
        </Link>
        <Link 
          to="/collections" 
          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Collections
        </Link>
      </div>

      {/* Premium features */}
      {isPremium() && (
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Premium Features
          </h3>
          <Link 
            to="/premium" 
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Premium Dashboard
          </Link>
        </div>
      )}

      {/* Admin features */}
      {isAdmin() && (
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Administration
          </h3>
          <Link 
            to="/admin" 
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Admin Dashboard
          </Link>
        </div>
      )}

      {/* User account */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Account
        </h3>
        <Link 
          to="/profile" 
          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Profile
        </Link>
        <Link 
          to="/settings" 
          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Settings
        </Link>
      </div>

      {/* Role indicator */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Role: <span className="font-medium capitalize">{user.role}</span>
        </div>
      </div>
    </nav>
  );
};

export default RoleBasedNav; 
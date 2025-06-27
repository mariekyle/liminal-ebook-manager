import React, { useState, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Sidebar from '../navigation/Sidebar';
import Header from '../layout/Header';
import Breadcrumbs from '../navigation/Breadcrumbs';
import { Menu } from 'lucide-react';
import '../../styles/layout.css';

const MainLayout = () => {
  const { user, isAuthenticated } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Don't show layout for auth pages
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);

  if (isAuthPage) {
    return <Outlet />;
  }

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Main content area */}
      <div className="main-content">
        {/* Header */}
        <Header>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
        </Header>

        {/* Page content */}
        <main className="page-content">
          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Page outlet */}
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 
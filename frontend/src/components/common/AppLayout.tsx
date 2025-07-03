import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 
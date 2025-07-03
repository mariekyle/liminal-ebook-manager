import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside style={{ padding: '1rem', borderRight: '1px solid #eee', minWidth: '180px' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <NavLink to="/library">Library</NavLink>
        <NavLink to="/collections">Collections</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar; 
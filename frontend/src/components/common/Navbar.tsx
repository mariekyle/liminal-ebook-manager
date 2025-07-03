import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid #eee' }}>
      <NavLink to="/library" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
        Liminal Ebook Manager
      </NavLink>
      <NavLink to="/library">Library</NavLink>
      <NavLink to="/collections">Collections</NavLink>
      <NavLink to="/profile">Profile</NavLink>
      <NavLink to="/settings">Settings</NavLink>
      {/* TODO: Show Login/Register or Logout based on auth state */}
      <NavLink to="/login">Login</NavLink>
      <NavLink to="/register">Register</NavLink>
    </nav>
  );
};

export default Navbar; 
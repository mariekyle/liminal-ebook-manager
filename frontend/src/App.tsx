import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Liminal Ebook Manager</h1>
      <p>Frontend is working!</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Quick Links:</h2>
        <ul>
          <li><a href="/login">Login</a></li>
          <li><a href="/register">Register</a></li>
          <li><a href="/library">Library</a></li>
        </ul>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <p><strong>Status:</strong> Container is running successfully!</p>
        <p><strong>API URL:</strong> http://172.16.3.2:8000</p>
      </div>
    </div>
  );
};

export default App; 
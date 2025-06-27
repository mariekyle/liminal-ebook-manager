import React, { useContext } from 'react';
import { useSettings } from '../context/SettingsContext';
import { AppContext } from '../context/AppContext';
import '../styles/settings.css';

const SettingsPage = () => {
  const { settings, updateSettings } = useSettings();
  const { actions: appActions } = useContext(AppContext);

  const handleThemeChange = (theme) => {
    updateSettings({ theme });
  };

  const handleAutoRefreshChange = (autoRefresh) => {
    updateSettings({ autoRefresh });
  };

  const handleAutoRefreshIntervalChange = (interval) => {
    updateSettings({ autoRefreshInterval: parseInt(interval) });
  };

  const handleClearCache = () => {
    appActions.clearCache();
  };

  const handleExportData = () => {
    appActions.exportData();
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your experience and manage your preferences</p>
      </div>

      <div className="settings-content">
        {/* Appearance Settings */}
        <div className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-item">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => handleThemeChange(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>

        {/* Library Settings */}
        <div className="settings-section">
          <h2>Library</h2>
          <div className="setting-item">
            <label htmlFor="autoRefresh">Auto Refresh</label>
            <input
              type="checkbox"
              id="autoRefresh"
              checked={settings.autoRefresh}
              onChange={(e) => handleAutoRefreshChange(e.target.checked)}
            />
          </div>
          
          {settings.autoRefresh && (
            <div className="setting-item">
              <label htmlFor="autoRefreshInterval">Refresh Interval (seconds)</label>
              <select
                id="autoRefreshInterval"
                value={settings.autoRefreshInterval}
                onChange={(e) => handleAutoRefreshIntervalChange(e.target.value)}
              >
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="settings-section">
          <h2>Data Management</h2>
          <div className="setting-item">
            <button onClick={handleClearCache} className="danger-button">
              Clear Cache
            </button>
            <p className="setting-description">
              Clear all cached data and reload from server
            </p>
          </div>
          
          <div className="setting-item">
            <button onClick={handleExportData}>
              Export Data
            </button>
            <p className="setting-description">
              Export your library data as JSON
            </p>
          </div>
        </div>

        {/* About */}
        <div className="settings-section">
          <h2>About</h2>
          <div className="setting-item">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Build:</strong> Development</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 
import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/common/Button';

const Settings = ({ onBack }) => {
  const { settings, actions, computed } = useSettings();
  const { actions: notificationActions } = useNotifications();

  const handleSettingChange = (key, value) => {
    actions.updateSetting(key, value);
    notificationActions.showInfo(`Setting updated: ${key}`);
  };

  const handleResetSettings = () => {
    actions.resetSettings();
    notificationActions.showSuccess('Settings reset to defaults');
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <Button variant="secondary" onClick={onBack}>
          ← Back to Library
        </Button>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Display</h2>
          
          <div className="setting-item">
            <label>
              <span>Theme</span>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>

          <div className="setting-item">
            <label>
              <span>Show Book Covers</span>
              <input
                type="checkbox"
                checked={settings.showCovers}
                onChange={(e) => handleSettingChange('showCovers', e.target.checked)}
              />
            </label>
          </div>

          <div className="setting-item">
            <label>
              <span>Items per Page</span>
              <select
                value={settings.itemsPerPage}
                onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Behavior</h2>
          
          <div className="setting-item">
            <label>
              <span>Auto-refresh Library</span>
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
              />
            </label>
          </div>

          <div className="setting-item">
            <label>
              <span>Auto-refresh Interval (seconds)</span>
              <select
                value={settings.autoRefreshInterval / 1000}
                onChange={(e) => handleSettingChange('autoRefreshInterval', parseInt(e.target.value) * 1000)}
                disabled={!settings.autoRefresh}
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={300}>5 minutes</option>
              </select>
            </label>
          </div>

          <div className="setting-item">
            <label>
              <span>Confirm Delete</span>
              <input
                type="checkbox"
                checked={settings.confirmDelete}
                onChange={(e) => handleSettingChange('confirmDelete', e.target.checked)}
              />
            </label>
          </div>

          <div className="setting-item">
            <label>
              <span>Show File Size</span>
              <input
                type="checkbox"
                checked={settings.showFileSize}
                onChange={(e) => handleSettingChange('showFileSize', e.target.checked)}
              />
            </label>
          </div>

          <div className="setting-item">
            <label>
              <span>Show Reading Time</span>
              <input
                type="checkbox"
                checked={settings.showReadingTime}
                onChange={(e) => handleSettingChange('showReadingTime', e.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Advanced</h2>
          
          <div className="setting-item">
            <label>
              <span>Enable Animations</span>
              <input
                type="checkbox"
                checked={settings.enableAnimations}
                onChange={(e) => handleSettingChange('enableAnimations', e.target.checked)}
              />
            </label>
          </div>

          <div className="setting-item">
            <label>
              <span>Enable Keyboard Shortcuts</span>
              <input
                type="checkbox"
                checked={settings.enableKeyboardShortcuts}
                onChange={(e) => handleSettingChange('enableKeyboardShortcuts', e.target.checked)}
              />
            </label>
          </div>

          <div className="setting-item">
            <label>
              <span>Offline Mode</span>
              <input
                type="checkbox"
                checked={settings.enableOfflineMode}
                onChange={(e) => handleSettingChange('enableOfflineMode', e.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Search History</h2>
          
          {computed.hasSearchHistory ? (
            <div className="search-history">
              {settings.searchHistory.map((query, index) => (
                <div key={index} className="search-history-item">
                  <span>{query}</span>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="small"
                onClick={() => {
                  actions.clearSearchHistory();
                  notificationActions.showInfo('Search history cleared');
                }}
              >
                Clear History
              </Button>
            </div>
          ) : (
            <p className="no-history">No search history yet</p>
          )}
        </div>

        <div className="settings-actions">
          <Button variant="danger" onClick={handleResetSettings}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 
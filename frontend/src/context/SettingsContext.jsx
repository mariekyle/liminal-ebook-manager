import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Default settings
const defaultSettings = {
  // Display settings
  theme: 'light',
  showCovers: true,
  itemsPerPage: 20,
  gridColumns: 4,
  
  // Behavior settings
  autoRefresh: true,
  autoRefreshInterval: 30000, // 30 seconds
  confirmDelete: true,
  showFileSize: true,
  showReadingTime: true,
  
  // Upload settings
  maxFileSize: 100, // MB
  allowedFileTypes: ['.epub'],
  
  // Search settings
  searchHistory: [],
  maxSearchHistory: 10,
  
  // Advanced settings
  enableAnimations: true,
  enableKeyboardShortcuts: true,
  enableOfflineMode: false
};

// Action types
const ACTIONS = {
  UPDATE_SETTING: 'UPDATE_SETTING',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  RESET_SETTINGS: 'RESET_SETTINGS',
  ADD_SEARCH_HISTORY: 'ADD_SEARCH_HISTORY',
  CLEAR_SEARCH_HISTORY: 'CLEAR_SEARCH_HISTORY'
};

// Reducer
const settingsReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.UPDATE_SETTING:
      return {
        ...state,
        [action.payload.key]: action.payload.value
      };
      
    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        ...action.payload
      };
      
    case ACTIONS.RESET_SETTINGS:
      return {
        ...defaultSettings
      };
      
    case ACTIONS.ADD_SEARCH_HISTORY:
      const { searchHistory, maxSearchHistory } = state;
      const newHistory = [action.payload, ...searchHistory.filter(item => item !== action.payload)]
        .slice(0, maxSearchHistory);
      return {
        ...state,
        searchHistory: newHistory
      };
      
    case ACTIONS.CLEAR_SEARCH_HISTORY:
      return {
        ...state,
        searchHistory: []
      };
      
    default:
      return state;
  }
};

// Create context
const SettingsContext = createContext();

// Provider component
export const SettingsProvider = ({ children }) => {
  const [settings, dispatch] = useReducer(settingsReducer, defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('liminal-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        dispatch({ 
          type: ACTIONS.UPDATE_SETTINGS, 
          payload: { ...defaultSettings, ...parsedSettings }
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('liminal-settings', JSON.stringify(settings));
  }, [settings]);

  // Actions
  const actions = {
    updateSetting: (key, value) => {
      dispatch({ 
        type: ACTIONS.UPDATE_SETTING, 
        payload: { key, value } 
      });
    },

    updateSettings: (newSettings) => {
      dispatch({ 
        type: ACTIONS.UPDATE_SETTINGS, 
        payload: newSettings 
      });
    },

    resetSettings: () => {
      dispatch({ type: ACTIONS.RESET_SETTINGS });
    },

    addSearchHistory: (query) => {
      if (query.trim()) {
        dispatch({ 
          type: ACTIONS.ADD_SEARCH_HISTORY, 
          payload: query.trim() 
        });
      }
    },

    clearSearchHistory: () => {
      dispatch({ type: ACTIONS.CLEAR_SEARCH_HISTORY });
    },

    // Convenience methods
    toggleTheme: () => {
      const newTheme = settings.theme === 'light' ? 'dark' : 'light';
      actions.updateSetting('theme', newTheme);
    },

    toggleShowCovers: () => {
      actions.updateSetting('showCovers', !settings.showCovers);
    },

    toggleAutoRefresh: () => {
      actions.updateSetting('autoRefresh', !settings.autoRefresh);
    },

    toggleConfirmDelete: () => {
      actions.updateSetting('confirmDelete', !settings.confirmDelete);
    },

    toggleAnimations: () => {
      actions.updateSetting('enableAnimations', !settings.enableAnimations);
    }
  };

  // Computed values
  const computed = {
    isDarkTheme: settings.theme === 'dark',
    isLightTheme: settings.theme === 'light',
    canAutoRefresh: settings.autoRefresh && settings.autoRefreshInterval > 0,
    hasSearchHistory: settings.searchHistory.length > 0
  };

  const value = {
    settings,
    actions,
    computed
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Initial state
const initialState = {
  notifications: []
};

// Action types
const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS'
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            ...action.payload
          }
        ]
      };
      
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
      
    case ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
      
    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timers = state.notifications.map(notification => {
      const timer = setTimeout(() => {
        dispatch({ 
          type: ACTIONS.REMOVE_NOTIFICATION, 
          payload: notification.id 
        });
      }, 5000); // 5 seconds

      return { id: notification.id, timer };
    });

    return () => {
      timers.forEach(({ timer }) => clearTimeout(timer));
    };
  }, [state.notifications]);

  // Actions
  const actions = {
    showNotification: (message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
      const notification = {
        message,
        type,
        ...options
      };
      
      dispatch({ 
        type: ACTIONS.ADD_NOTIFICATION, 
        payload: notification 
      });
      
      return notification.id;
    },

    showSuccess: (message, options = {}) => {
      return actions.showNotification(message, NOTIFICATION_TYPES.SUCCESS, options);
    },

    showError: (message, options = {}) => {
      return actions.showNotification(message, NOTIFICATION_TYPES.ERROR, options);
    },

    showWarning: (message, options = {}) => {
      return actions.showNotification(message, NOTIFICATION_TYPES.WARNING, options);
    },

    showInfo: (message, options = {}) => {
      return actions.showNotification(message, NOTIFICATION_TYPES.INFO, options);
    },

    removeNotification: (id) => {
      dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
    },

    clearNotifications: () => {
      dispatch({ type: ACTIONS.CLEAR_NOTIFICATIONS });
    }
  };

  const value = {
    notifications: state.notifications,
    actions
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 
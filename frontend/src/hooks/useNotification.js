import { useCallback } from 'react';

export const useNotification = () => {
  const showNotification = useCallback((message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles if not already present
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          max-width: 300px;
        }
        .notification.show {
          transform: translateX(0);
        }
        .notification.success {
          background-color: #10b981;
        }
        .notification.error {
          background-color: #ef4444;
        }
        .notification.info {
          background-color: #3b82f6;
        }
        .notification.warning {
          background-color: #f59e0b;
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }, []);

  return { showNotification };
}; 
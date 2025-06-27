import React from 'react';

const Loading = ({ 
  size = 'medium', 
  variant = 'spinner',
  text = 'Loading...',
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  };

  const renderSpinner = () => (
    <svg className={`loading-spinner ${sizeClasses[size]}`} viewBox="0 0 24 24">
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
        fill="none" 
        strokeDasharray="31.416" 
        strokeDashoffset="31.416"
      >
        <animate 
          attributeName="stroke-dasharray" 
          dur="2s" 
          values="0 31.416;15.708 15.708;0 31.416" 
          repeatCount="indefinite"
        />
        <animate 
          attributeName="stroke-dashoffset" 
          dur="2s" 
          values="0;-15.708;-31.416" 
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );

  const renderDots = () => (
    <div className={`loading-dots ${sizeClasses[size]}`}>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`loading-pulse ${sizeClasses[size]}`}></div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className="loading-container">
      {renderLoader()}
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading; 
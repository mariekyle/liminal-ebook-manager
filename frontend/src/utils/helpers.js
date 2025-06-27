import { colorPalette } from './constants';

export const generateGradient = () => {
  const color1 = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  const color2 = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  const angle = Math.floor(Math.random() * 360);
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
};

export const formatReadingTime = (wordCount) => {
  if (wordCount === -1) {
    return 'Could not calculate';
  }
  if (!wordCount || wordCount === 0) {
    return 'Calculating...';
  }

  const wpm = 195; // User's average reading speed
  const minutes = wordCount / wpm;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (minutes < 1) {
    return 'Less than a minute';
  }
  
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`);
  }
  return parts.join(' ');
};

export const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
}; 
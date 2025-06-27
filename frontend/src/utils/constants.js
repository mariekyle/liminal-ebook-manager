export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const colorPalette = [
  '#ff9a9e', '#fecfef', '#f6d365', '#fda085', '#a1c4fd', 
  '#c2e9fb', '#d4fc79', '#96e6a1', '#84fab0', '#8fd3f4',
  '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#fa709a'
];

export const SORT_OPTIONS = {
  'recently-added': 'Recently added',
  'title-asc': 'Title (A-Z)',
  'title-desc': 'Title (Z-A)',
  'read-time-asc': 'Quick Reads First',
  'read-time-desc': 'Long Reads First',
  'date-published-desc': 'Published Newest First',
  'date-published-asc': 'Published Oldest First'
}; 
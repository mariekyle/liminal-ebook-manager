import { getApiConfig, getUIConfig } from '../config';

// API Configuration (now from config)
export const API_URL = getApiConfig().baseURL;

// UI Configuration
const uiConfig = getUIConfig();

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

// Pagination constants
export const DEFAULT_PAGE_SIZE = uiConfig.pagination.defaultPageSize;
export const MAX_PAGE_SIZE = uiConfig.pagination.maxPageSize;

// Search constants
export const SEARCH_DEBOUNCE_MS = uiConfig.search.debounceMs;
export const MIN_QUERY_LENGTH = uiConfig.search.minQueryLength;

// Upload constants
export const MAX_FILE_SIZE = uiConfig.upload.maxFileSize;
export const ALLOWED_FILE_TYPES = uiConfig.upload.allowedTypes;
export const ENABLE_DRAG_DROP = uiConfig.upload.enableDragDrop;

// Theme constants
export const DEFAULT_THEME = uiConfig.theme.default;
export const ENABLE_SYSTEM_THEME = uiConfig.theme.enableSystemTheme; 
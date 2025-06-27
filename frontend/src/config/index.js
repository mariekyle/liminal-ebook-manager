/**
 * Frontend Configuration Management
 * Loads environment-specific configuration from environment variables
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Base configuration
const baseConfig = {
  // API Configuration
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
    retries: parseInt(process.env.REACT_APP_API_RETRIES) || 3,
    retryDelay: parseInt(process.env.REACT_APP_API_RETRY_DELAY) || 1000,
  },

  // Application Configuration
  app: {
    name: process.env.REACT_APP_NAME || 'Liminal eBook Manager',
    version: process.env.REACT_APP_VERSION || '1.0.0',
    description: process.env.REACT_APP_DESCRIPTION || 'A modern ebook management system',
    environment: process.env.NODE_ENV || 'development',
  },

  // Feature Flags
  features: {
    enableNotifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false',
    enableOfflineMode: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    enableDebugMode: process.env.REACT_APP_ENABLE_DEBUG === 'true',
    enableKeyboardShortcuts: process.env.REACT_APP_ENABLE_KEYBOARD_SHORTCUTS !== 'false',
  },

  // UI Configuration
  ui: {
    theme: {
      default: process.env.REACT_APP_DEFAULT_THEME || 'light',
      enableSystemTheme: process.env.REACT_APP_ENABLE_SYSTEM_THEME !== 'false',
    },
    pagination: {
      defaultPageSize: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 20,
      maxPageSize: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE) || 100,
    },
    search: {
      debounceMs: parseInt(process.env.REACT_APP_SEARCH_DEBOUNCE) || 300,
      minQueryLength: parseInt(process.env.REACT_APP_MIN_QUERY_LENGTH) || 2,
    },
    upload: {
      maxFileSize: process.env.REACT_APP_MAX_FILE_SIZE || '100MB',
      allowedTypes: (process.env.REACT_APP_ALLOWED_FILE_TYPES || '.epub').split(','),
      enableDragDrop: process.env.REACT_APP_ENABLE_DRAG_DROP !== 'false',
    },
  },

  // Cache Configuration
  cache: {
    enabled: process.env.REACT_APP_CACHE_ENABLED !== 'false',
    defaultTTL: parseInt(process.env.REACT_APP_CACHE_TTL) || 3600000, // 1 hour
    maxSize: parseInt(process.env.REACT_APP_CACHE_MAX_SIZE) || 100,
  },

  // Error Handling
  errors: {
    showDetails: isDevelopment,
    logToConsole: isDevelopment,
    reportToService: process.env.REACT_APP_ERROR_REPORTING === 'true',
  },

  // Performance
  performance: {
    enableLazyLoading: process.env.REACT_APP_ENABLE_LAZY_LOADING !== 'false',
    enableVirtualScrolling: process.env.REACT_APP_ENABLE_VIRTUAL_SCROLLING === 'true',
    imageOptimization: process.env.REACT_APP_IMAGE_OPTIMIZATION !== 'false',
  },
};

// Environment-specific overrides
const environmentConfigs = {
  development: {
    api: {
      timeout: 60000, // Longer timeout for development
    },
    features: {
      enableDebugMode: true,
      enableNotifications: true,
    },
    errors: {
      showDetails: true,
      logToConsole: true,
    },
    ui: {
      theme: {
        default: 'light',
      },
    },
  },

  production: {
    api: {
      timeout: 15000, // Shorter timeout for production
    },
    features: {
      enableDebugMode: false,
      enableAnalytics: true,
    },
    errors: {
      showDetails: false,
      logToConsole: false,
      reportToService: true,
    },
    performance: {
      enableLazyLoading: true,
      enableVirtualScrolling: true,
      imageOptimization: true,
    },
  },

  test: {
    api: {
      baseURL: 'http://localhost:8001',
      timeout: 5000,
    },
    features: {
      enableNotifications: false,
      enableAnalytics: false,
    },
    cache: {
      enabled: false,
    },
    ui: {
      pagination: {
        defaultPageSize: 10,
      },
    },
  },
};

// Merge configurations
const getConfig = () => {
  const envConfig = environmentConfigs[process.env.NODE_ENV] || environmentConfigs.development;
  
  return {
    ...baseConfig,
    ...envConfig,
    // Deep merge for nested objects
    api: { ...baseConfig.api, ...envConfig.api },
    features: { ...baseConfig.features, ...envConfig.features },
    ui: { ...baseConfig.ui, ...envConfig.ui },
    cache: { ...baseConfig.cache, ...envConfig.cache },
    errors: { ...baseConfig.errors, ...envConfig.errors },
    performance: { ...baseConfig.performance, ...envConfig.performance },
  };
};

// Utility functions
const config = getConfig();

export const getApiConfig = () => config.api;
export const getAppConfig = () => config.app;
export const getFeatureConfig = () => config.features;
export const getUIConfig = () => config.ui;
export const getCacheConfig = () => config.cache;
export const getErrorConfig = () => config.errors;
export const getPerformanceConfig = () => config.performance;

// Validation
const validateConfig = () => {
  const errors = [];

  // Validate API configuration
  if (!config.api.baseURL) {
    errors.push('API base URL is required');
  }

  // Validate file upload configuration
  if (config.ui.upload.maxFileSize && !config.ui.upload.maxFileSize.match(/^\d+(KB|MB|GB)$/)) {
    errors.push('Invalid max file size format. Use KB, MB, or GB suffix');
  }

  // Validate pagination
  if (config.ui.pagination.defaultPageSize > config.ui.pagination.maxPageSize) {
    errors.push('Default page size cannot be greater than max page size');
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    if (isProduction) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
};

// Run validation
validateConfig();

// Export configuration
export default config;

// Export environment helpers
export const isDev = isDevelopment;
export const isProd = isProduction;
export const isTestEnv = isTest;

// Export configuration helpers
export const getEnvironment = () => config.app.environment;
export const isFeatureEnabled = (feature) => config.features[feature] === true;
export const getApiUrl = (endpoint = '') => `${config.api.baseURL}${endpoint}`;
export const getMaxFileSizeBytes = () => {
  const size = config.ui.upload.maxFileSize;
  const match = size.match(/^(\d+)(KB|MB|GB)$/);
  if (!match) return 100 * 1024 * 1024; // Default 100MB
  
  const [, value, unit] = match;
  const multipliers = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return parseInt(value) * multipliers[unit];
}; 
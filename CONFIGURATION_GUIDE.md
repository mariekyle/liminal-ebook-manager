# Configuration & Environment Management Guide

## Overview

The Liminal eBook Manager uses a comprehensive configuration system that supports multiple environments (development, staging, production, testing) with environment-specific settings, validation, and security features.

## Quick Start

1. **Copy the appropriate environment file:**
   ```bash
   # For development
   cp env.development .env
   
   # For production
   cp env.production .env
   
   # For testing
   cp env.testing .env
   ```

2. **Update the configuration values** in your `.env` file

3. **Start the application** - it will automatically load and validate the configuration

## Environment Files

### `env.example`
Complete template with all available configuration options and documentation.

### `env.development`
Development-specific settings with:
- Debug mode enabled
- Loose CORS settings
- Smaller file size limits
- Console logging
- Auto-generated secrets

### `env.production`
Production-ready settings with:
- Debug mode disabled
- Strict CORS settings
- Larger file size limits
- File logging
- Required secure secrets

### `env.testing`
Testing-specific settings with:
- Separate test database
- Minimal CORS
- Small file limits
- Error-only logging
- Test-specific secrets

## Configuration Categories

### Environment Configuration
```bash
ENVIRONMENT=development  # development, staging, production, testing
DEBUG=false             # Enable debug mode
TESTING=false           # Enable testing mode
```

### Database Configuration
```bash
DATABASE_URL=postgresql://user:password@host:port/database
DB_POOL_SIZE=10         # Connection pool size
DB_MAX_OVERFLOW=20      # Maximum overflow connections
DB_POOL_TIMEOUT=30      # Connection timeout (seconds)
DB_POOL_RECYCLE=3600    # Connection recycle time (seconds)
```

### Security Configuration
```bash
SECRET_KEY=your_super_secret_key_here_minimum_32_characters_long
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
BCRYPT_ROUNDS=12
```

### CORS Configuration
```bash
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
ALLOWED_HEADERS=*
ALLOW_CREDENTIALS=true
```

### File Upload Configuration
```bash
UPLOAD_MAX_SIZE=100MB
ALLOWED_FILE_EXTENSIONS=.epub,.pdf
UPLOAD_DIR=uploads
TEMP_DIR=temp
ENABLE_COMPRESSION=true
```

### Logging Configuration
```bash
LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FILE_PATH=/var/log/liminal/app.log
LOG_MAX_SIZE=10MB
LOG_BACKUP_COUNT=5
```

### Redis Configuration
```bash
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_CONNECTIONS=10
```

### Cache Configuration
```bash
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=3600  # Time to live in seconds
CACHE_MAX_SIZE=1000     # Maximum cache entries
CACHE_STRATEGY=lru      # lru, lfu, fifo
```

### API Configuration
```bash
APP_TITLE=Liminal eBook Manager
APP_VERSION=1.0.0
APP_DESCRIPTION=A modern ebook management system
HOST=0.0.0.0
PORT=8000
WORKERS=1
```

### Frontend Configuration
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_DEBUG=true
REACT_APP_DEFAULT_THEME=light
```

## Backend Configuration System

### Settings Class
The backend uses a centralized `Settings` class that:
- Loads environment variables
- Validates configuration values
- Provides type-safe access to settings
- Creates necessary directories
- Sets up logging

### Configuration Manager
The `ConfigManager` provides utilities for:
- Environment switching
- Configuration validation
- Health checks
- Configuration export
- Human-readable summaries

### Usage Examples

```python
from app.config.settings import settings
from app.config.manager import config_manager

# Access settings
db_url = settings.get_database_url()
redis_url = settings.get_redis_url()

# Check environment
if settings.is_production:
    # Production-specific logic
    pass

# Get configuration summary
summary = config_manager.get_config_summary()
print(summary)

# Check environment health
health = config_manager.check_environment_health()
if health['status'] == 'unhealthy':
    print("Configuration issues:", health['issues'])
```

## Frontend Configuration System

### Configuration Module
The frontend uses a centralized configuration module that:
- Loads environment variables
- Provides environment-specific overrides
- Validates configuration
- Exports utility functions

### Usage Examples

```javascript
import config, { 
  getApiConfig, 
  getUIConfig, 
  isFeatureEnabled,
  getApiUrl 
} from './config';

// Access configuration
const apiConfig = getApiConfig();
const uiConfig = getUIConfig();

// Check features
if (isFeatureEnabled('enableNotifications')) {
  // Show notifications
}

// Get API URL
const booksUrl = getApiUrl('/books');

// Environment helpers
if (config.isDev) {
  // Development-specific logic
}
```

## Environment-Specific Considerations

### Development
- Debug mode enabled
- Loose security settings
- Console logging
- Auto-generated secrets
- Longer timeouts
- All CORS origins allowed

### Production
- Debug mode disabled
- Strict security settings
- File logging required
- Secure secrets required
- Shorter timeouts
- Restricted CORS origins
- SSL/TLS required

### Testing
- Separate test database
- Minimal configuration
- Error-only logging
- Test-specific secrets
- Fast timeouts
- Minimal CORS

## Security Best Practices

### Secrets Management
1. **Never commit secrets** to version control
2. **Use strong secrets** (minimum 32 characters)
3. **Rotate secrets** regularly
4. **Use different secrets** for each environment
5. **Consider using** a secrets management service

### Environment Variables
1. **Validate all inputs** before use
2. **Use appropriate defaults** for development
3. **Require critical values** in production
4. **Document all variables** in `env.example`

### CORS Configuration
1. **Restrict origins** in production
2. **Use HTTPS** for production origins
3. **Limit methods** to what's needed
4. **Set appropriate** max age

## Validation and Health Checks

### Backend Validation
The backend automatically validates:
- Required environment variables
- Database connection strings
- Redis connection strings
- File size limits
- Log levels
- Cache strategies

### Health Checks
```python
# Check configuration health
health = config_manager.check_environment_health()

if health['status'] == 'healthy':
    print("Configuration is healthy")
else:
    print("Issues:", health['issues'])
    print("Warnings:", health['warnings'])
```

### Frontend Validation
The frontend validates:
- API configuration
- File upload settings
- Pagination settings
- Feature flags

## Deployment Considerations

### Docker
- Use environment-specific `.env` files
- Pass secrets via environment variables
- Use Docker secrets for sensitive data
- Consider using Docker Compose for local development

### Production Deployment
1. **Copy production config:**
   ```bash
   cp env.production .env
   ```

2. **Update all secrets** and URLs

3. **Set up SSL/TLS** certificates

4. **Configure logging** to files

5. **Set up monitoring** and health checks

6. **Test configuration** before deployment

### Environment Switching
```bash
# Switch to development
cp env.development .env

# Switch to production
cp env.production .env

# Switch to testing
cp env.testing .env
```

## Troubleshooting

### Common Issues

1. **Configuration not loading:**
   - Check `.env` file exists
   - Verify environment variable names
   - Check for syntax errors

2. **Validation errors:**
   - Review error messages
   - Check required variables
   - Verify data types

3. **Environment-specific issues:**
   - Use correct environment file
   - Check environment-specific settings
   - Verify environment detection

### Debug Commands

```bash
# Check configuration summary
python -c "from app.config.manager import config_manager; print(config_manager.get_config_summary())"

# Check environment health
python -c "from app.config.manager import config_manager; import json; print(json.dumps(config_manager.check_environment_health(), indent=2))"

# Export configuration
python -c "from app.config.manager import config_manager; import json; print(json.dumps(config_manager.export_config(), indent=2))"
```

## Migration and Updates

### Adding New Configuration
1. **Update `env.example`** with new variables
2. **Update environment files** with appropriate values
3. **Update backend settings** class
4. **Update frontend config** module
5. **Add validation** if needed
6. **Update documentation**

### Breaking Changes
1. **Version configuration** changes
2. **Update migration guide**
3. **Provide upgrade path**
4. **Test all environments**

## Conclusion

The configuration system provides a robust, secure, and flexible way to manage application settings across different environments. By following the guidelines in this document, you can ensure your application is properly configured for development, testing, and production use.

For additional help, refer to:
- `env.example` for complete configuration options
- Backend configuration classes for implementation details
- Frontend configuration module for client-side settings 
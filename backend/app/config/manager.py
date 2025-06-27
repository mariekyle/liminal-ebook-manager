"""
Configuration Manager
Provides utilities for managing configuration across different environments
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from .settings import Settings
import logging

logger = logging.getLogger(__name__)

class ConfigManager:
    """Manages configuration across different environments"""
    
    def __init__(self):
        self.settings = Settings()
        self._config_cache = {}
    
    def get_environment(self) -> str:
        """Get current environment"""
        return self.settings.environment
    
    def is_environment(self, environment: str) -> bool:
        """Check if current environment matches"""
        return self.settings.environment == environment
    
    def get_config_for_environment(self, environment: str) -> Dict[str, Any]:
        """Get configuration for a specific environment"""
        if environment in self._config_cache:
            return self._config_cache[environment]
        
        # Load environment-specific config
        config_file = Path(__file__).parent.parent.parent / f"env.{environment}"
        
        if not config_file.exists():
            logger.warning(f"Environment config file not found: {config_file}")
            return {}
        
        config = {}
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
        
        self._config_cache[environment] = config
        return config
    
    def validate_environment_config(self, environment: str) -> bool:
        """Validate configuration for a specific environment"""
        config = self.get_config_for_environment(environment)
        
        required_vars = [
            'DATABASE_URL',
            'SECRET_KEY',
            'ALLOWED_ORIGINS'
        ]
        
        missing_vars = []
        for var in required_vars:
            if var not in config or not config[var]:
                missing_vars.append(var)
        
        if missing_vars:
            logger.error(f"Missing required environment variables for {environment}: {missing_vars}")
            return False
        
        return True
    
    def export_config(self, environment: str = None) -> Dict[str, Any]:
        """Export configuration as dictionary"""
        if environment is None:
            environment = self.settings.environment
        
        config = {
            'environment': environment,
            'database': {
                'url': self.settings.database_url or '',
                'pool_size': self.settings.db_pool_size,
                'max_overflow': self.settings.db_max_overflow,
                'pool_timeout': self.settings.db_pool_timeout,
                'pool_recycle': self.settings.db_pool_recycle,
            },
            'security': {
                'secret_key_length': len(self.settings.secret_key) if self.settings.secret_key else 0,
                'jwt_algorithm': self.settings.jwt_algorithm,
                'access_token_expire_minutes': self.settings.access_token_expire_minutes,
                'refresh_token_expire_days': self.settings.refresh_token_expire_days,
                'bcrypt_rounds': self.settings.bcrypt_rounds,
            },
            'cors': {
                'allowed_origins': self.settings.allowed_origins,
                'allowed_methods': self.settings.allowed_methods,
                'allowed_headers': self.settings.allowed_headers,
                'allow_credentials': self.settings.allow_credentials,
                'max_age': self.settings.cors_max_age,
            },
            'file_upload': {
                'max_file_size': self.settings.max_file_size,
                'allowed_extensions': self.settings.allowed_extensions,
                'upload_dir': self.settings.upload_dir,
                'temp_dir': self.settings.temp_dir,
                'enable_compression': self.settings.enable_compression,
            },
            'logging': {
                'level': self.settings.log_level,
                'format': self.settings.log_format,
                'file_path': self.settings.log_file_path,
                'max_size': self.settings.log_max_size,
                'backup_count': self.settings.log_backup_count,
            },
            'redis': {
                'url': self.settings.redis_url,
                'host': self.settings.redis_host,
                'port': self.settings.redis_port,
                'db': self.settings.redis_db,
                'max_connections': self.settings.redis_max_connections,
            },
            'cache': {
                'enabled': self.settings.cache_enabled,
                'default_ttl': self.settings.cache_default_ttl,
                'max_size': self.settings.cache_max_size,
                'strategy': self.settings.cache_strategy,
            },
            'api': {
                'title': self.settings.app_title,
                'version': self.settings.app_version,
                'description': self.settings.app_description,
                'docs_url': self.settings.api_docs_url,
                'redoc_url': self.settings.api_redoc_url,
                'openapi_url': self.settings.api_openapi_url,
                'host': self.settings.host,
                'port': self.settings.port,
                'workers': self.settings.workers,
            },
            'paths': {
                'base_dir': str(self.settings.base_dir),
                'static_dir': str(self.settings.static_dir),
                'media_dir': str(self.settings.media_dir),
                'upload_dir': str(self.settings.base_dir / self.settings.upload_dir),
                'temp_dir': str(self.settings.base_dir / self.settings.temp_dir),
            }
        }
        
        return config
    
    def get_config_summary(self) -> str:
        """Get a human-readable configuration summary"""
        config = self.export_config()
        
        summary = f"""
Configuration Summary for {config['environment'].upper()} environment:
{'='*60}

Database:
  URL: {config['database']['url'][:50]}...
  Pool Size: {config['database']['pool_size']}
  Max Overflow: {config['database']['max_overflow']}

Security:
  Secret Key Length: {config['security']['secret_key_length']} characters
  JWT Algorithm: {config['security']['jwt_algorithm']}
  Access Token Expiry: {config['security']['access_token_expire_minutes']} minutes
  Refresh Token Expiry: {config['security']['refresh_token_expire_days']} days

CORS:
  Allowed Origins: {', '.join(config['cors']['allowed_origins'])}
  Allowed Methods: {', '.join(config['cors']['allowed_methods'])}

File Upload:
  Max File Size: {config['file_upload']['max_file_size']}
  Allowed Extensions: {', '.join(config['file_upload']['allowed_extensions'])}
  Upload Directory: {config['file_upload']['upload_dir']}
  Compression: {'Enabled' if config['file_upload']['enable_compression'] else 'Disabled'}

Logging:
  Level: {config['logging']['level']}
  File Path: {config['logging']['file_path'] or 'Console only'}

Redis:
  URL: {config['redis']['url']}
  Host: {config['redis']['host']}:{config['redis']['port']}
  Database: {config['redis']['db']}

Cache:
  Enabled: {'Yes' if config['cache']['enabled'] else 'No'}
  TTL: {config['cache']['default_ttl']} seconds
  Strategy: {config['cache']['strategy'].upper()}

API:
  Title: {config['api']['title']}
  Version: {config['api']['version']}
  Host: {config['api']['host']}:{config['api']['port']}
  Workers: {config['api']['workers']}

Paths:
  Base Directory: {config['paths']['base_dir']}
  Upload Directory: {config['paths']['upload_dir']}
  Static Directory: {config['paths']['static_dir']}
"""
        return summary
    
    def check_environment_health(self) -> Dict[str, Any]:
        """Check the health of the current environment configuration"""
        health = {
            'environment': self.settings.environment,
            'status': 'healthy',
            'issues': [],
            'warnings': [],
            'checks': {}
        }
        
        # Check database configuration
        if not self.settings.database_url:
            health['issues'].append('DATABASE_URL is not configured')
            health['status'] = 'unhealthy'
        elif not self.settings.database_url.startswith(('postgresql://', 'postgres://')):
            health['warnings'].append('DATABASE_URL may not be a valid PostgreSQL connection string')
        
        # Check security configuration
        if len(self.settings.secret_key) < 32:
            health['issues'].append('SECRET_KEY is too short (minimum 32 characters)')
            health['status'] = 'unhealthy'
        
        # Check CORS configuration
        if not self.settings.allowed_origins:
            health['issues'].append('No CORS origins configured')
            health['status'] = 'unhealthy'
        
        # Check file upload configuration
        if not self.settings.allowed_extensions:
            health['warnings'].append('No allowed file extensions configured')
        
        # Check directories
        directories = [
            self.settings.base_dir / self.settings.upload_dir,
            self.settings.base_dir / self.settings.temp_dir,
            self.settings.static_dir,
            self.settings.media_dir,
        ]
        
        for directory in directories:
            if not directory.exists():
                health['warnings'].append(f'Directory does not exist: {directory}')
        
        # Check Redis configuration
        if not self.settings.redis_url.startswith(('redis://', 'rediss://')):
            health['warnings'].append('REDIS_URL may not be a valid Redis connection string')
        
        # Production-specific checks
        if self.settings.is_production:
            if self.settings.debug:
                health['warnings'].append('Debug mode is enabled in production')
            
            if not self.settings.log_file_path:
                health['warnings'].append('No log file configured for production')
        
        health['checks'] = {
            'database_configured': bool(self.settings.database_url),
            'security_configured': len(self.settings.secret_key) >= 32,
            'cors_configured': bool(self.settings.allowed_origins),
            'directories_exist': all(d.exists() for d in directories),
            'production_ready': self.settings.is_production and not self.settings.debug,
        }
        
        return health

# Global config manager instance
config_manager = ConfigManager() 
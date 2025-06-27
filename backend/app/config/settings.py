import os
import secrets
from typing import List, Optional, Union
from pathlib import Path
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Settings:
    """Main application settings"""
    
    def __init__(self):
        # Environment
        self.environment = os.getenv('ENVIRONMENT', 'development').lower()
        self.debug = os.getenv('DEBUG', 'false').lower() == 'true'
        self.testing = os.getenv('TESTING', 'false').lower() == 'true'
        
        # Database
        self.database_url = os.getenv('DATABASE_URL', '')
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        self.db_pool_size = int(os.getenv('DB_POOL_SIZE', '10'))
        self.db_max_overflow = int(os.getenv('DB_MAX_OVERFLOW', '20'))
        self.db_pool_timeout = int(os.getenv('DB_POOL_TIMEOUT', '30'))
        self.db_pool_recycle = int(os.getenv('DB_POOL_RECYCLE', '3600'))
        
        # Security
        self.secret_key = os.getenv('SECRET_KEY', '')
        if not self.secret_key:
            if self.environment == 'production':
                raise ValueError("SECRET_KEY is required in production")
            self.secret_key = secrets.token_urlsafe(32)
            logger.warning("Generated random SECRET_KEY for development")
        
        if len(self.secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        
        self.jwt_algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
        self.access_token_expire_minutes = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
        self.refresh_token_expire_days = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '7'))
        self.bcrypt_rounds = int(os.getenv('BCRYPT_ROUNDS', '12'))
        
        # CORS
        allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000')
        self.allowed_origins = [origin.strip() for origin in allowed_origins.split(',') if origin.strip()]
        self.allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        self.allowed_headers = ["*"]
        self.allow_credentials = True
        self.cors_max_age = 86400  # 24 hours
        
        # File Upload
        self.max_file_size = os.getenv('UPLOAD_MAX_SIZE', '100MB')
        allowed_extensions = os.getenv('ALLOWED_FILE_EXTENSIONS', '.epub')
        self.allowed_extensions = [ext.strip() for ext in allowed_extensions.split(',') if ext.strip()]
        self.upload_dir = os.getenv('UPLOAD_DIR', 'uploads')
        self.temp_dir = os.getenv('TEMP_DIR', 'temp')
        self.enable_compression = os.getenv('ENABLE_COMPRESSION', 'true').lower() == 'true'
        
        # Logging
        self.log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        self.log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        self.log_file_path = os.getenv('LOG_FILE_PATH')
        self.log_max_size = os.getenv('LOG_MAX_SIZE', '10MB')
        self.log_backup_count = int(os.getenv('LOG_BACKUP_COUNT', '5'))
        
        # Redis
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis_host = os.getenv('REDIS_HOST', 'localhost')
        self.redis_port = int(os.getenv('REDIS_PORT', '6379'))
        self.redis_password = os.getenv('REDIS_PASSWORD')
        self.redis_db = int(os.getenv('REDIS_DB', '0'))
        self.redis_max_connections = int(os.getenv('REDIS_MAX_CONNECTIONS', '10'))
        
        # Cache
        self.cache_enabled = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
        self.cache_default_ttl = int(os.getenv('CACHE_DEFAULT_TTL', '3600'))
        self.cache_max_size = int(os.getenv('CACHE_MAX_SIZE', '1000'))
        self.cache_strategy = os.getenv('CACHE_STRATEGY', 'lru').lower()
        
        # API
        self.app_title = os.getenv('APP_TITLE', 'Liminal eBook Manager')
        self.app_version = os.getenv('APP_VERSION', '1.0.0')
        self.app_description = os.getenv('APP_DESCRIPTION', 'A modern ebook management system')
        self.api_docs_url = os.getenv('API_DOCS_URL', '/docs')
        self.api_redoc_url = os.getenv('API_REDOC_URL', '/redoc')
        self.api_openapi_url = os.getenv('API_OPENAPI_URL', '/openapi.json')
        self.host = os.getenv('HOST', '0.0.0.0')
        self.port = int(os.getenv('PORT', '8000'))
        self.workers = int(os.getenv('WORKERS', '1'))
        
        # Paths
        self.base_dir = Path(__file__).parent.parent.parent
        self.static_dir = self.base_dir / "static"
        self.media_dir = self.base_dir / "media"
        
        # Validation and setup
        self._validate_settings()
        self._setup_directories()
        self._setup_logging()
    
    def _validate_settings(self):
        """Validate settings based on environment"""
        # Validate database URL
        if self.database_url and not self.database_url.startswith(('postgresql://', 'postgres://')):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        
        # Validate file size
        size_str = self.max_file_size.upper()
        if size_str.endswith('MB'):
            size_mb = int(size_str[:-2])
            if size_mb > 1000:  # 1GB limit
                raise ValueError("Maximum file size cannot exceed 1GB")
        elif size_str.endswith('GB'):
            size_gb = int(size_str[:-2])
            if size_gb > 1:
                raise ValueError("Maximum file size cannot exceed 1GB")
        
        # Validate log level
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if self.log_level not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of: {', '.join(valid_levels)}")
        
        # Validate Redis URL
        if self.redis_url and not self.redis_url.startswith(('redis://', 'rediss://')):
            raise ValueError("REDIS_URL must be a valid Redis connection string")
        
        # Validate cache strategy
        valid_strategies = ['lru', 'lfu', 'fifo']
        if self.cache_strategy not in valid_strategies:
            raise ValueError(f"CACHE_STRATEGY must be one of: {', '.join(valid_strategies)}")
        
        # Validate environment
        valid_environments = ['development', 'staging', 'production', 'testing']
        if self.environment not in valid_environments:
            raise ValueError(f"ENVIRONMENT must be one of: {', '.join(valid_environments)}")
        
        # Production validations
        if self.environment == 'production':
            if self.debug:
                logger.warning("Debug mode is enabled in production")
            
            if len(self.allowed_origins) == 0:
                raise ValueError("At least one CORS origin is required in production")
        
        logger.info(f"Application configured for {self.environment} environment")
    
    def _setup_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            self.base_dir / self.upload_dir,
            self.base_dir / self.temp_dir,
            self.static_dir,
            self.media_dir,
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"Ensured directory exists: {directory}")
    
    def _setup_logging(self):
        """Configure logging based on settings"""
        log_config = {
            'level': getattr(logging, self.log_level),
            'format': self.log_format,
        }
        
        if self.log_file_path:
            log_config['filename'] = self.log_file_path
        
        logging.basicConfig(**log_config)
        logger.info(f"Logging configured with level: {self.log_level}")
    
    @property
    def is_development(self) -> bool:
        return self.environment == 'development'
    
    @property
    def is_production(self) -> bool:
        return self.environment == 'production'
    
    @property
    def is_testing(self) -> bool:
        return self.environment == 'testing'
    
    def get_database_url(self) -> str:
        """Get database URL with proper formatting"""
        if not self.database_url:
            raise ValueError("DATABASE_URL is not configured")
        return self.database_url
    
    def get_redis_url(self) -> str:
        """Get Redis URL with proper formatting"""
        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"
    
    def get_upload_path(self, filename: str) -> Path:
        """Get full path for uploaded file"""
        return self.base_dir / self.upload_dir / filename
    
    def get_temp_path(self, filename: str) -> Path:
        """Get full path for temporary file"""
        return self.base_dir / self.temp_dir / filename
    
    def get_max_file_size_bytes(self) -> int:
        """Convert max file size string to bytes"""
        size_str = self.max_file_size.upper()
        if size_str.endswith('KB'):
            return int(size_str[:-2]) * 1024
        elif size_str.endswith('MB'):
            return int(size_str[:-2]) * 1024 * 1024
        elif size_str.endswith('GB'):
            return int(size_str[:-2]) * 1024 * 1024 * 1024
        else:
            return int(size_str)

# Create global settings instance
try:
    settings = Settings()
    logger.info("Settings loaded successfully")
except Exception as e:
    logger.error(f"Failed to load settings: {e}")
    raise 
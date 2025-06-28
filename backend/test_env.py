import os
import tempfile
from pathlib import Path

# Create a temporary SQLite database for testing
temp_dir = Path(tempfile.gettempdir()) / "ebook_manager_test"
temp_dir.mkdir(exist_ok=True)
db_path = temp_dir / "test.db"

# Set environment variables for testing
os.environ.update({
    'ENVIRONMENT': 'testing',
    'DEBUG': 'true',
    'TESTING': 'true',
    'DATABASE_URL': f'sqlite:///{db_path}',
    'SECRET_KEY': 'test_secret_key_for_development_only_32_chars_long',
    'JWT_ALGORITHM': 'HS256',
    'ACCESS_TOKEN_EXPIRE_MINUTES': '60',
    'REFRESH_TOKEN_EXPIRE_DAYS': '30',
    'BCRYPT_ROUNDS': '4',
    'ALLOWED_ORIGINS': 'http://localhost:3000,http://127.0.0.1:3000',
    'UPLOAD_MAX_SIZE': '50MB',
    'ALLOWED_FILE_EXTENSIONS': '.epub,.pdf',
    'UPLOAD_DIR': 'uploads',
    'TEMP_DIR': 'temp',
    'ENABLE_COMPRESSION': 'false',
    'LOG_LEVEL': 'DEBUG',
    'REDIS_URL': 'redis://localhost:6379',
    'REDIS_HOST': 'localhost',
    'REDIS_PORT': '6379',
    'REDIS_PASSWORD': '',
    'REDIS_DB': '1',
    'REDIS_MAX_CONNECTIONS': '5',
    'CACHE_ENABLED': 'false',
    'CACHE_DEFAULT_TTL': '300',
    'CACHE_MAX_SIZE': '100',
    'CACHE_STRATEGY': 'lru',
    'APP_TITLE': 'Liminal eBook Manager (Test)',
    'APP_VERSION': '1.0.0-test',
    'APP_DESCRIPTION': 'A modern ebook management system - Testing',
    'API_DOCS_URL': '/docs',
    'API_REDOC_URL': '/redoc',
    'API_OPENAPI_URL': '/openapi.json',
    'HOST': '0.0.0.0',
    'PORT': '8000',
    'WORKERS': '1',
    'REACT_APP_API_URL': 'http://localhost:8000',
    'REACT_APP_VERSION': '1.0.0-test',
    'AUTO_RELOAD': 'true',
    'DETAILED_ERRORS': 'true'
})

print(f"Test environment configured with SQLite database: {db_path}")
print("Environment variables set for testing") 
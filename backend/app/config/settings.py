import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv('DATABASE_URL') or ""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    
    # File upload
    MAX_FILE_SIZE: str = os.getenv('MAX_FILE_SIZE', '100MB')
    UPLOAD_DIR: str = os.getenv('UPLOAD_DIR', 'uploads')
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # Application
    APP_TITLE: str = "Liminal Ebook Manager"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "A modern ebook management system"

# Create settings instance
settings = Settings() 
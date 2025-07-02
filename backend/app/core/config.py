from pydantic import BaseModel
from typing import Optional, List
import os


class Settings(BaseModel):
    # Application
    app_name: str = "Liminal Ebook Manager"
    debug: bool = False
    api_v1_str: str = "/api/v1"
    
    # Database
    database_url: str = "postgresql://liminal:changeme@localhost/liminal_db"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = "changeme-generate-a-secure-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # File Storage
    upload_path: str = "/app/storage/uploads"
    library_path: str = "/app/storage/library"
    max_upload_size: int = 104857600  # 100MB
    
    # OPDS
    opds_title: str = "Liminal Library"
    opds_author: str = "Liminal"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]


# Load settings from environment
settings = Settings(
    database_url=os.getenv("DATABASE_URL", "postgresql://liminal:changeme@localhost/liminal_db"),
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
    secret_key=os.getenv("SECRET_KEY", "changeme-generate-a-secure-key"),
    debug=os.getenv("DEBUG", "false").lower() == "true"
)


# Global settings instance
settings = Settings() 
"""
Tests for the books API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.config.database import get_db, Base
from app.models.book import Book

# Create in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    """Override the database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_get_books_empty():
    """Test getting books when library is empty."""
    response = client.get("/api/v1/books")
    assert response.status_code == 200
    assert response.json() == []

def test_upload_book_invalid_file():
    """Test uploading a non-EPUB file."""
    files = {"file": ("test.txt", b"not an epub file", "text/plain")}
    response = client.post("/api/v1/books/upload", files=files)
    assert response.status_code == 400
    assert "Only EPUB files are supported" in response.json()["detail"]

def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Liminal Ebook Manager is running" in data["message"]

def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to Liminal Ebook Manager"
    assert data["version"] == "1.0.0" 
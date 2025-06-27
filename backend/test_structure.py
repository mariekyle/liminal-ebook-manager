#!/usr/bin/env python3
"""
Test script to verify the new modular structure works correctly.
Run this to check that all imports work before switching to the new structure.
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all modules can be imported successfully."""
    print("Testing imports...")
    
    try:
        # Test config imports
        print("✓ Testing config imports...")
        from app.config.settings import settings
        from app.config.database import get_db, run_migrations
        
        # Test models imports
        print("✓ Testing models imports...")
        from app.models.book import BookDB, Base
        from app.models.schemas import BookCreate, BookResponse
        
        # Test services imports
        print("✓ Testing services imports...")
        from app.services.epub_service import calculate_word_count, extract_epub_metadata
        from app.services.book_service import backfill_word_counts, backfill_missing_metadata
        
        # Test utils imports
        print("✓ Testing utils imports...")
        from app.utils.validators import validate_file_size, validate_epub_file
        
        # Test API imports
        print("✓ Testing API imports...")
        from app.api.v1.books import router as books_router
        from app.api.v1.health import router as health_router
        from app.api.v1.stats import router as stats_router
        
        # Test main app import
        print("✓ Testing main app import...")
        from app.main import app
        
        print("\n🎉 All imports successful! The modular structure is working correctly.")
        return True
        
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

def test_settings():
    """Test that settings are loaded correctly."""
    print("\nTesting settings...")
    try:
        from app.config.settings import settings
        print(f"✓ DATABASE_URL: {'Set' if settings.DATABASE_URL else 'Not set'}")
        print(f"✓ ALLOWED_ORIGINS: {settings.ALLOWED_ORIGINS}")
        print(f"✓ APP_TITLE: {settings.APP_TITLE}")
        return True
    except Exception as e:
        print(f"❌ Settings error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Liminal Ebook Manager Modular Structure")
    print("=" * 50)
    
    success = True
    success &= test_imports()
    success &= test_settings()
    
    if success:
        print("\n✅ All tests passed! You can now switch to the new structure.")
        print("\nTo switch to the new structure:")
        print("1. Rename main.py to main_old.py")
        print("2. Rename main_new.py to main.py")
        print("3. Update your Dockerfile to use the new main.py")
    else:
        print("\n❌ Some tests failed. Please fix the issues before switching.")
        sys.exit(1) 
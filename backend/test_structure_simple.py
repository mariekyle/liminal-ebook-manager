#!/usr/bin/env python3
"""
Simple test script to verify the new modular structure files exist and have correct syntax.
"""

import os
import ast
import sys

def check_file_exists(filepath):
    """Check if a file exists."""
    if os.path.exists(filepath):
        print(f"✓ {filepath}")
        return True
    else:
        print(f"❌ {filepath} - MISSING")
        return False

def check_python_syntax(filepath):
    """Check if a Python file has valid syntax."""
    try:
        with open(filepath, 'r') as f:
            ast.parse(f.read())
        print(f"✓ {filepath} - Valid Python syntax")
        return True
    except SyntaxError as e:
        print(f"❌ {filepath} - Syntax error: {e}")
        return False
    except Exception as e:
        print(f"❌ {filepath} - Error: {e}")
        return False

def test_structure():
    """Test that all required files exist and have valid syntax."""
    print("🔍 Testing Liminal Ebook Manager File Structure")
    print("=" * 50)
    
    # List of files that should exist
    required_files = [
        "app/__init__.py",
        "app/main.py",
        "app/config/__init__.py",
        "app/config/settings.py",
        "app/config/database.py",
        "app/models/__init__.py",
        "app/models/book.py",
        "app/models/schemas.py",
        "app/services/__init__.py",
        "app/services/epub_service.py",
        "app/services/book_service.py",
        "app/utils/__init__.py",
        "app/utils/validators.py",
        "app/api/__init__.py",
        "app/api/v1/__init__.py",
        "app/api/v1/books.py",
        "app/api/v1/health.py",
        "app/api/v1/stats.py",
        "main_new.py",
        "test_structure.py"
    ]
    
    success = True
    
    print("\n📁 Checking file existence...")
    for filepath in required_files:
        if not check_file_exists(filepath):
            success = False
    
    print("\n🐍 Checking Python syntax...")
    python_files = [f for f in required_files if f.endswith('.py')]
    for filepath in python_files:
        if not check_python_syntax(filepath):
            success = False
    
    print("\n📊 Structure Summary:")
    print(f"Total files: {len(required_files)}")
    print(f"Python files: {len(python_files)}")
    
    return success

def show_directory_structure():
    """Show the current directory structure."""
    print("\n📂 Current Directory Structure:")
    print("=" * 30)
    
    def print_tree(path, prefix=""):
        items = sorted(os.listdir(path))
        for i, item in enumerate(items):
            if item.startswith('.'):
                continue
            item_path = os.path.join(path, item)
            is_last = i == len(items) - 1
            current_prefix = "└── " if is_last else "├── "
            print(f"{prefix}{current_prefix}{item}")
            
            if os.path.isdir(item_path):
                next_prefix = prefix + ("    " if is_last else "│   ")
                print_tree(item_path, next_prefix)
    
    print_tree(".")

if __name__ == "__main__":
    success = test_structure()
    show_directory_structure()
    
    if success:
        print("\n✅ All files exist and have valid syntax!")
        print("\n🎉 The modular structure is ready!")
        print("\nNext steps:")
        print("1. Test with the full environment (install dependencies)")
        print("2. Rename main.py to main_old.py (backup)")
        print("3. Rename main_new.py to main.py")
        print("4. Update Dockerfile if needed")
        print("5. Test the application")
    else:
        print("\n❌ Some issues found. Please fix them before proceeding.")
        sys.exit(1) 
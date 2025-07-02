#!/usr/bin/env python3
"""
Simple test script to verify API endpoints
Run with: python test_api.py
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_root_endpoint():
    """Test root endpoint"""
    print("\n🔍 Testing root endpoint...")
    try:
        response = requests.get(BASE_URL)
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False

def test_register():
    """Test user registration"""
    print("\n🔍 Testing user registration...")
    try:
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpass123"
        }
        response = requests.post(f"{API_URL}/auth/register", json=user_data)
        print(f"✅ Register: {response.status_code}")
        if response.status_code == 200:
            print(f"   User created: {response.json()}")
        else:
            print(f"   Error: {response.text}")
        return response.status_code in [200, 400]  # 400 if user already exists
    except Exception as e:
        print(f"❌ Register failed: {e}")
        return False

def test_login():
    """Test user login"""
    print("\n🔍 Testing user login...")
    try:
        login_data = {
            "username": "test@example.com",
            "password": "testpass123"
        }
        response = requests.post(f"{API_URL}/auth/login", data=login_data)
        print(f"✅ Login: {response.status_code}")
        if response.status_code == 200:
            tokens = response.json()
            print(f"   Access token: {tokens['access_token'][:20]}...")
            return tokens["access_token"]
        else:
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return None

def test_protected_endpoint(token: str):
    """Test protected endpoint"""
    print("\n🔍 Testing protected endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        print(f"✅ Protected endpoint: {response.status_code}")
        if response.status_code == 200:
            user = response.json()
            print(f"   User: {user['email']}")
        else:
            print(f"   Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Protected endpoint failed: {e}")
        return False

def test_books_endpoint(token: str):
    """Test books endpoint"""
    print("\n🔍 Testing books endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/books/", headers=headers)
        print(f"✅ Books endpoint: {response.status_code}")
        if response.status_code == 200:
            books = response.json()
            print(f"   Books count: {len(books)}")
        else:
            print(f"   Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Books endpoint failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting API tests...")
    print("=" * 50)
    
    # Test basic endpoints
    health_ok = test_health_check()
    root_ok = test_root_endpoint()
    
    if not health_ok or not root_ok:
        print("\n❌ Basic endpoints failed. Is the server running?")
        print("   Start with: uvicorn app.main:app --reload")
        return
    
    # Test authentication
    register_ok = test_register()
    token = test_login()
    
    if not token:
        print("\n❌ Authentication failed")
        return
    
    # Test protected endpoints
    protected_ok = test_protected_endpoint(token)
    books_ok = test_books_endpoint(token)
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Health check: {'✅' if health_ok else '❌'}")
    print(f"   Root endpoint: {'✅' if root_ok else '❌'}")
    print(f"   Registration: {'✅' if register_ok else '❌'}")
    print(f"   Login: {'✅' if token else '❌'}")
    print(f"   Protected endpoint: {'✅' if protected_ok else '❌'}")
    print(f"   Books endpoint: {'✅' if books_ok else '❌'}")
    
    if all([health_ok, root_ok, register_ok, token, protected_ok, books_ok]):
        print("\n🎉 All tests passed! API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")

if __name__ == "__main__":
    main() 
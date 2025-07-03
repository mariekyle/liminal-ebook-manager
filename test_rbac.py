#!/usr/bin/env python3
"""
RBAC Test Script for Liminal Ebook Manager

This script tests the role-based access control system by:
1. Creating users with different roles
2. Testing authentication
3. Testing role-based access to different endpoints
4. Verifying protected routes work correctly
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json"}

# Test users with different roles
TEST_USERS = [
    {
        "username": "admin_user",
        "email": "admin@test.com",
        "password": "adminpass123",
        "role": "admin"
    },
    {
        "username": "moderator_user", 
        "email": "moderator@test.com",
        "password": "modpass123",
        "role": "moderator"
    },
    {
        "username": "premium_user",
        "email": "premium@test.com", 
        "password": "premiumpass123",
        "role": "premium"
    },
    {
        "username": "basic_user",
        "email": "basic@test.com",
        "password": "basicpass123", 
        "role": "basic"
    }
]

class RBACTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.users = {}
        self.tokens = {}
        
    def print_step(self, step: str):
        """Print a formatted step header"""
        print(f"\n{'='*60}")
        print(f"STEP: {step}")
        print(f"{'='*60}")
        
    def print_result(self, success: bool, message: str):
        """Print a formatted result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {message}")
        
    def test_backend_connection(self) -> bool:
        """Test if backend is accessible"""
        self.print_step("Testing Backend Connection")
        try:
            response = requests.get(f"{self.base_url}/docs", timeout=5)
            if response.status_code == 200:
                self.print_result(True, "Backend is accessible")
                return True
            else:
                self.print_result(False, f"Backend returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.print_result(False, f"Backend connection failed: {e}")
            return False
            
    def register_user(self, user_data: Dict[str, Any]) -> bool:
        """Register a test user"""
        try:
            response = requests.post(
                f"{self.base_url}/auth/register",
                headers=HEADERS,
                json={
                    "username": user_data["username"],
                    "email": user_data["email"],
                    "password": user_data["password"]
                }
            )
            
            if response.status_code == 200:
                user = response.json()
                self.users[user_data["username"]] = user
                self.print_result(True, f"Registered user: {user_data['username']}")
                return True
            elif response.status_code == 400 and "already exists" in response.text:
                self.print_result(True, f"User already exists: {user_data['username']}")
                return True
            else:
                self.print_result(False, f"Registration failed for {user_data['username']}: {response.text}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Registration error for {user_data['username']}: {e}")
            return False
            
    def login_user(self, user_data: Dict[str, Any]) -> bool:
        """Login a user and store the token"""
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "username": user_data["email"],
                    "password": user_data["password"]
                }
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.tokens[user_data["username"]] = token_data["access_token"]
                self.print_result(True, f"Logged in user: {user_data['username']}")
                return True
            else:
                self.print_result(False, f"Login failed for {user_data['username']}: {response.text}")
                return False
                
        except Exception as e:
            self.print_result(False, f"Login error for {user_data['username']}: {e}")
            return False
            
    def get_user_info(self, username: str) -> Dict[str, Any]:
        """Get current user information"""
        token = self.tokens.get(username)
        if not token:
            return {}
            
        try:
            response = requests.get(
                f"{self.base_url}/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {}
                
        except Exception:
            return {}
            
    def test_role_access(self, username: str, endpoint: str, expected_status: int) -> bool:
        """Test if a user can access a specific endpoint"""
        token = self.tokens.get(username)
        if not token:
            return False
            
        try:
            response = requests.get(
                f"{self.base_url}/{endpoint}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            success = response.status_code == expected_status
            self.print_result(success, f"{username} ({self.users[username]['role']}) -> {endpoint}: {response.status_code}")
            return success
            
        except Exception as e:
            self.print_result(False, f"Error testing {username} -> {endpoint}: {e}")
            return False
            
    def run_tests(self):
        """Run all RBAC tests"""
        print("🚀 Starting RBAC System Tests")
        print(f"Testing against: {self.base_url}")
        
        # Step 1: Test backend connection
        if not self.test_backend_connection():
            print("\n❌ Backend not accessible. Please ensure the backend is running.")
            return
            
        # Step 2: Register all test users
        self.print_step("Registering Test Users")
        for user_data in TEST_USERS:
            self.register_user(user_data)
            
        # Step 3: Login all users
        self.print_step("Logging In Test Users")
        for user_data in TEST_USERS:
            self.login_user(user_data)
            
        # Step 4: Verify user roles
        self.print_step("Verifying User Roles")
        for user_data in TEST_USERS:
            username = user_data["username"]
            user_info = self.get_user_info(username)
            if user_info:
                actual_role = user_info.get("role", "unknown")
                expected_role = user_data["role"]
                success = actual_role == expected_role
                self.print_result(success, f"{username}: expected {expected_role}, got {actual_role}")
            else:
                self.print_result(False, f"Could not get user info for {username}")
                
        # Step 5: Test role-based access to different endpoints
        self.print_step("Testing Role-Based Access")
        
        # Test basic endpoints (should work for all authenticated users)
        basic_endpoints = ["books", "collections"]
        for endpoint in basic_endpoints:
            for user_data in TEST_USERS:
                username = user_data["username"]
                if username in self.tokens:
                    self.test_role_access(username, endpoint, 200)
                    
        # Test admin-only endpoints (should only work for admin)
        admin_endpoints = ["admin/users", "admin/settings"]
        for endpoint in admin_endpoints:
            for user_data in TEST_USERS:
                username = user_data["username"]
                if username in self.tokens:
                    expected_status = 200 if user_data["role"] == "admin" else 403
                    self.test_role_access(username, endpoint, expected_status)
                    
        # Step 6: Test frontend routes (if accessible)
        self.print_step("Testing Frontend Routes")
        frontend_url = "http://localhost:3000"
        try:
            response = requests.get(frontend_url, timeout=5)
            if response.status_code == 200:
                self.print_result(True, "Frontend is accessible")
                
                # Test protected routes
                protected_routes = ["/library", "/admin", "/premium"]
                for route in protected_routes:
                    try:
                        response = requests.get(f"{frontend_url}{route}", timeout=5)
                        if response.status_code == 200:
                            self.print_result(True, f"Frontend route {route} is accessible")
                        else:
                            self.print_result(False, f"Frontend route {route} returned {response.status_code}")
                    except Exception as e:
                        self.print_result(False, f"Frontend route {route} error: {e}")
            else:
                self.print_result(False, f"Frontend returned status {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.print_result(False, f"Frontend not accessible: {e}")
            
        # Step 7: Summary
        self.print_step("Test Summary")
        print(f"✅ Registered users: {len(self.users)}")
        print(f"✅ Logged in users: {len(self.tokens)}")
        print(f"✅ Test users with roles:")
        for user_data in TEST_USERS:
            username = user_data["username"]
            role = user_data["role"]
            token_status = "✅" if username in self.tokens else "❌"
            print(f"   {token_status} {username}: {role}")
            
        print("\n🎉 RBAC Testing Complete!")
        print("\nNext steps:")
        print("1. Start your frontend application")
        print("2. Navigate to http://localhost:3000")
        print("3. Login with different test users")
        print("4. Test role-based navigation and access")

def main():
    """Main test function"""
    tester = RBACTester(BASE_URL)
    tester.run_tests()

if __name__ == "__main__":
    main() 
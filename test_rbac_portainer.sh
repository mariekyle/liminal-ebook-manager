#!/bin/bash

# RBAC Test Script for Portainer/Docker Environment
# This script tests the RBAC system when running in containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000/api/v1"
FRONTEND_URL="http://localhost:3000"

# Test users
declare -A TEST_USERS=(
    ["admin_user"]="admin@test.com:adminpass123:admin"
    ["moderator_user"]="moderator@test.com:modpass123:moderator"
    ["premium_user"]="premium@test.com:premiumpass123:premium"
    ["basic_user"]="basic@test.com:basicpass123:basic"
)

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "FAIL")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
    esac
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to check if a service is accessible
check_service() {
    local url=$1
    local service_name=$2
    
    print_status "INFO" "Checking $service_name at $url"
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        print_status "SUCCESS" "$service_name is accessible"
        return 0
    else
        print_status "FAIL" "$service_name is not accessible at $url"
        return 1
    fi
}

# Function to register a user
register_user() {
    local username=$1
    local email=$2
    local password=$3
    local role=$4
    
    print_status "INFO" "Registering user: $username ($role)"
    
    local response=$(curl -s -w "%{http_code}" -X POST "$BACKEND_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"email\": \"$email\",
            \"password\": \"$password\"
        }")
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        print_status "SUCCESS" "User $username registered successfully"
        return 0
    elif [ "$http_code" = "400" ] && echo "$body" | grep -q "already exists"; then
        print_status "SUCCESS" "User $username already exists"
        return 0
    else
        print_status "FAIL" "Failed to register user $username: $body"
        return 1
    fi
}

# Function to login a user and get token
login_user() {
    local username=$1
    local email=$2
    local password=$3
    
    print_status "INFO" "Logging in user: $username"
    
    local response=$(curl -s -X POST "$BACKEND_URL/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=$email&password=$password")
    
    if echo "$response" | grep -q "access_token"; then
        local token=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        print_status "SUCCESS" "User $username logged in successfully"
        echo "$token"
        return 0
    else
        print_status "FAIL" "Failed to login user $username: $response"
        return 1
    fi
}

# Function to get user info
get_user_info() {
    local token=$1
    local username=$2
    
    print_status "INFO" "Getting user info for: $username"
    
    local response=$(curl -s -X GET "$BACKEND_URL/auth/me" \
        -H "Authorization: Bearer $token")
    
    if echo "$response" | grep -q "role"; then
        local role=$(echo "$response" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
        print_status "SUCCESS" "User $username has role: $role"
        echo "$role"
        return 0
    else
        print_status "FAIL" "Failed to get user info for $username: $response"
        return 1
    fi
}

# Function to test frontend routes
test_frontend_routes() {
    local token=$1
    local username=$2
    local user_role=$3
    
    print_status "INFO" "Testing frontend routes for $username ($user_role)"
    
    # Test basic routes (should work for all authenticated users)
    local basic_routes=("/library" "/collections" "/profile" "/settings")
    for route in "${basic_routes[@]}"; do
        if curl -s --max-time 5 "$FRONTEND_URL$route" > /dev/null 2>&1; then
            print_status "SUCCESS" "Route $route accessible for $username"
        else
            print_status "FAIL" "Route $route not accessible for $username"
        fi
    done
    
    # Test premium routes (should work for premium+ users)
    if [[ "$user_role" == "premium" || "$user_role" == "moderator" || "$user_role" == "admin" ]]; then
        if curl -s --max-time 5 "$FRONTEND_URL/premium" > /dev/null 2>&1; then
            print_status "SUCCESS" "Premium route accessible for $username"
        else
            print_status "FAIL" "Premium route not accessible for $username"
        fi
    else
        print_status "INFO" "Skipping premium route test for $username (role: $user_role)"
    fi
    
    # Test admin routes (should work for admin only)
    if [[ "$user_role" == "admin" ]]; then
        if curl -s --max-time 5 "$FRONTEND_URL/admin" > /dev/null 2>&1; then
            print_status "SUCCESS" "Admin route accessible for $username"
        else
            print_status "FAIL" "Admin route not accessible for $username"
        fi
    else
        print_status "INFO" "Skipping admin route test for $username (role: $user_role)"
    fi
}

# Main test function
main() {
    print_header "RBAC System Test - Portainer/Docker Environment"
    
    # Check prerequisites
    print_header "Checking Prerequisites"
    
    if ! check_service "$BACKEND_URL/docs" "Backend API"; then
        print_status "WARNING" "Backend not accessible. Please ensure containers are running."
        print_status "INFO" "You can start the containers using: ./dev.sh"
        exit 1
    fi
    
    if ! check_service "$FRONTEND_URL" "Frontend"; then
        print_status "WARNING" "Frontend not accessible. Please ensure containers are running."
        print_status "INFO" "You can start the containers using: ./dev.sh"
        exit 1
    fi
    
    # Register and test users
    print_header "Testing User Registration and Authentication"
    
    declare -A user_tokens
    
    for username in "${!TEST_USERS[@]}"; do
        IFS=':' read -r email password role <<< "${TEST_USERS[$username]}"
        
        # Register user
        if register_user "$username" "$email" "$password" "$role"; then
            # Login user
            token=$(login_user "$username" "$email" "$password")
            if [ $? -eq 0 ]; then
                user_tokens["$username"]="$token"
                
                # Get user info and verify role
                actual_role=$(get_user_info "$token" "$username")
                if [ $? -eq 0 ] && [ "$actual_role" = "$role" ]; then
                    print_status "SUCCESS" "Role verification passed for $username"
                else
                    print_status "FAIL" "Role verification failed for $username (expected: $role, got: $actual_role)"
                fi
            fi
        fi
    done
    
    # Test frontend routes for each user
    print_header "Testing Frontend Route Access"
    
    for username in "${!user_tokens[@]}"; do
        IFS=':' read -r email password role <<< "${TEST_USERS[$username]}"
        token="${user_tokens[$username]}"
        
        test_frontend_routes "$token" "$username" "$role"
    done
    
    # Summary
    print_header "Test Summary"
    
    local registered_count=0
    local logged_in_count=0
    
    for username in "${!TEST_USERS[@]}"; do
        if [ -n "${user_tokens[$username]}" ]; then
            ((logged_in_count++))
            print_status "SUCCESS" "User $username: ✅ Logged in"
        else
            print_status "FAIL" "User $username: ❌ Login failed"
        fi
        ((registered_count++))
    done
    
    echo -e "\n${GREEN}Test Results:${NC}"
    echo -e "  📊 Total users tested: $registered_count"
    echo -e "  ✅ Successfully logged in: $logged_in_count"
    echo -e "  ❌ Failed logins: $((registered_count - logged_in_count))"
    
    if [ $logged_in_count -eq $registered_count ]; then
        print_status "SUCCESS" "All users successfully authenticated!"
        echo -e "\n${GREEN}🎉 RBAC System Test Complete!${NC}"
        echo -e "\n${BLUE}Next Steps:${NC}"
        echo -e "1. Open your browser and go to: $FRONTEND_URL"
        echo -e "2. Login with different test users to see role-based access"
        echo -e "3. Test navigation changes based on user roles"
        echo -e "4. Try accessing restricted routes with different users"
    else
        print_status "FAIL" "Some users failed to authenticate. Check the logs above."
        exit 1
    fi
}

# Run the main function
main "$@" 
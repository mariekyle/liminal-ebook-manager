# RBAC System Test Guide

This guide provides step-by-step instructions for testing the Role-Based Access Control (RBAC) system in the Liminal Ebook Manager.

## Prerequisites

1. **Backend running**: Ensure your backend is running via Docker/Portainer
2. **Frontend running**: Ensure your frontend is running via Docker/Portainer
3. **Database access**: Ensure the database is accessible and migrations are applied

## Test Users

The system includes these test users with different roles:

| Username | Email | Password | Role | Description |
|----------|-------|----------|------|-------------|
| `admin_user` | admin@test.com | adminpass123 | admin | Full system access |
| `moderator_user` | moderator@test.com | modpass123 | moderator | Content management |
| `premium_user` | premium@test.com | premiumpass123 | premium | Advanced features |
| `basic_user` | basic@test.com | basicpass123 | basic | Standard features |

## Manual Testing Steps

### 1. Backend API Testing

#### Test User Registration
```bash
# Register admin user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_user",
    "email": "admin@test.com",
    "password": "adminpass123"
  }'

# Register other users similarly...
```

#### Test User Login
```bash
# Login admin user
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@test.com&password=adminpass123"
```

#### Test User Info (with role)
```bash
# Get current user info (replace TOKEN with actual token)
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### 2. Frontend Testing

#### Test Authentication Flow
1. **Navigate to frontend**: Go to `http://localhost:3000`
2. **Should redirect to login**: If not authenticated, should redirect to `/login`
3. **Login with different users**: Test each test user
4. **Verify role display**: Check that user role is displayed correctly

#### Test Protected Routes
1. **Basic routes** (should work for all authenticated users):
   - `/library` - Book library
   - `/collections` - Collections
   - `/profile` - User profile
   - `/settings` - Settings

2. **Premium routes** (should work for premium+ users):
   - `/premium` - Premium features

3. **Admin routes** (should work for admin only):
   - `/admin` - Admin dashboard

#### Test Role-Based Navigation
1. **Login as basic user**: Should see basic navigation only
2. **Login as premium user**: Should see premium features in navigation
3. **Login as admin**: Should see admin features in navigation

#### Test Access Denied Scenarios
1. **Try to access `/admin` as non-admin**: Should show access denied message
2. **Try to access `/premium` as basic user**: Should show access denied message
3. **Check unauthorized message**: Should display required roles and user's current role

### 3. Role Hierarchy Testing

#### Test Role Inheritance
1. **Admin user**: Should have access to all features
2. **Moderator user**: Should have access to premium features + moderation
3. **Premium user**: Should have access to premium features
4. **Basic user**: Should have access to basic features only

#### Test Role Level Checking
1. **Use `hasMinimumRole()`**: Test hierarchical role checking
2. **Verify role levels**: Admin(4) > Moderator(3) > Premium(2) > Basic(1)

### 4. UI/UX Testing

#### Test Role Indicators
1. **Role display**: User's role should be visible in navigation
2. **Role badges**: Check if role badges are displayed correctly
3. **Permission indicators**: Visual feedback for role-based access

#### Test Navigation Changes
1. **Dynamic menus**: Navigation should change based on user role
2. **Hidden features**: Features should be hidden for unauthorized users
3. **Accessible features**: Features should be visible for authorized users

## Automated Testing

### Run the Test Script
```bash
# Make script executable
chmod +x test_rbac.py

# Run the test script
python3 test_rbac.py
```

### Expected Test Results
- ✅ Backend connection successful
- ✅ User registration successful
- ✅ User login successful
- ✅ Role verification successful
- ✅ Role-based access control working
- ✅ Frontend routes protected correctly

## Troubleshooting

### Common Issues

1. **Backend not accessible**
   - Check if Docker containers are running
   - Verify port 8000 is accessible
   - Check backend logs for errors

2. **Frontend not accessible**
   - Check if frontend container is running
   - Verify port 3000 is accessible
   - Check frontend logs for errors

3. **Authentication failing**
   - Verify user credentials
   - Check if user exists in database
   - Verify JWT token generation

4. **Role not working**
   - Check if user has correct role in database
   - Verify role field is returned by `/me` endpoint
   - Check frontend role checking logic

### Debug Steps

1. **Check backend logs**:
   ```bash
   docker logs liminal-backend
   ```

2. **Check frontend logs**:
   ```bash
   docker logs liminal-frontend
   ```

3. **Check database**:
   ```sql
   SELECT username, email, role FROM users;
   ```

4. **Test API directly**:
   ```bash
   curl -X GET http://localhost:8000/api/v1/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Success Criteria

The RBAC system is working correctly if:

1. ✅ Users can register and login
2. ✅ User roles are correctly stored and retrieved
3. ✅ Protected routes redirect unauthenticated users
4. ✅ Role-based access control works for different endpoints
5. ✅ Frontend shows appropriate navigation based on user role
6. ✅ Access denied messages are displayed for unauthorized access
7. ✅ Role hierarchy works correctly (higher roles inherit lower permissions)

## Next Steps After Testing

1. **Add more roles**: Extend the role system with additional roles
2. **Enhance permissions**: Add more granular permission controls
3. **Add role management**: Create admin interface for managing user roles
4. **Add audit logging**: Track role changes and access attempts
5. **Performance testing**: Test with many users and complex role hierarchies 
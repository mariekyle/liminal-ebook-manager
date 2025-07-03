# Role-Based Access Control (RBAC) System

This document explains how the role-based access control system works in the Liminal Ebook Manager frontend.

## Overview

The RBAC system provides:
- **Authentication protection**: Ensures users are logged in before accessing protected routes
- **Role-based authorization**: Controls access based on user roles
- **Hierarchical permissions**: Higher roles inherit permissions from lower roles
- **Flexible configuration**: Easy to add new roles and permissions

## User Roles

### Role Hierarchy (from highest to lowest)
1. **Admin** (`admin`) - Full system access
2. **Moderator** (`moderator`) - Content management and user moderation
3. **Premium** (`premium`) - Advanced features and unlimited access
4. **Basic** (`basic`) - Standard user features (default role)

### Role Permissions

| Feature | Basic | Premium | Moderator | Admin |
|---------|-------|---------|-----------|-------|
| View books | ✅ | ✅ | ✅ | ✅ |
| Create collections | ✅ | ✅ | ✅ | ✅ |
| Premium features | ❌ | ✅ | ✅ | ✅ |
| Moderate content | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |

## Components

### ProtectedRoute
The main component for protecting routes based on authentication and roles.

```tsx
<ProtectedRoute 
  requiredRoles={['admin', 'moderator']}
  showUnauthorizedMessage={true}
  fallbackPath="/login"
>
  <AdminPage />
</ProtectedRoute>
```

**Props:**
- `children`: React components to render if access is granted
- `requiredRoles`: String or array of strings for required roles
- `fallbackPath`: Where to redirect if not authenticated (default: `/login`)
- `showUnauthorizedMessage`: Show detailed access denied message (default: `false`)

### useAuth Hook
Custom hook providing authentication and role checking utilities.

```tsx
const { 
  isAuthenticated, 
  user, 
  isAdmin, 
  isPremium, 
  hasRole, 
  hasMinimumRole 
} = useAuth();
```

**Methods:**
- `isAdmin()`: Check if user is admin
- `isModerator()`: Check if user is moderator or admin
- `isPremium()`: Check if user is premium or higher
- `hasRole(roles)`: Check if user has specific role(s)
- `hasMinimumRole(role)`: Check if user has at least the specified role level

### RoleBasedNav
Navigation component that shows different menu items based on user roles.

## Usage Examples

### Basic Route Protection
```tsx
<Route path="/library" element={
  <ProtectedRoute>
    <LibraryPage />
  </ProtectedRoute>
} />
```

### Role-Specific Route Protection
```tsx
<Route path="/admin" element={
  <ProtectedRoute 
    requiredRoles={ROLE_GROUPS.ADMIN_ONLY}
    showUnauthorizedMessage={true}
  >
    <AdminPage />
  </ProtectedRoute>
} />
```

### Conditional Rendering
```tsx
const { isAdmin, isPremium } = useAuth();

return (
  <div>
    {isAdmin() && <AdminPanel />}
    {isPremium() && <PremiumFeatures />}
  </div>
);
```

### Role Checking in Components
```tsx
const { hasRole, hasMinimumRole } = useAuth();

// Check for specific role
if (hasRole('admin')) {
  // Admin-only code
}

// Check for minimum role level
if (hasMinimumRole('premium')) {
  // Premium and above code
}
```

## Configuration

### Adding New Roles
1. Add the role to `ROLES` in `types/roles.ts`
2. Update `ROLE_HIERARCHY` with the appropriate level
3. Add role to `ROLE_GROUPS` if needed
4. Update permission matrix in this documentation

### Role Groups
Predefined role combinations for common use cases:
- `ADMIN_ONLY`: Only admin users
- `STAFF`: Admin and moderator users
- `PREMIUM_AND_ABOVE`: Premium users and above
- `ALL_USERS`: All authenticated users

## Security Notes

1. **Frontend-only protection**: This system provides UI-level protection only
2. **Backend validation**: Always validate permissions on the backend API
3. **Token security**: JWT tokens should be validated on every request
4. **Role updates**: User roles should be refreshed when changed

## Testing

To test different roles:
1. Create users with different roles in the backend
2. Login with different accounts
3. Navigate to protected routes
4. Verify access is granted/denied appropriately
5. Check that unauthorized users see appropriate messages 
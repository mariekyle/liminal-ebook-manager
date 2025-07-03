import { useAuthStore } from '../store/auth';
import { ROLES, ROLE_GROUPS, hasMinimumRole, UserRole } from '../types/roles';

export const useAuth = () => {
  const auth = useAuthStore();

  return {
    ...auth,
    // Convenience methods for role checking
    isAdmin: () => auth.hasRole(ROLES.ADMIN),
    isModerator: () => auth.hasRole([ROLES.ADMIN, ROLES.MODERATOR]),
    isPremium: () => auth.hasRole([ROLES.ADMIN, ROLES.MODERATOR, ROLES.PREMIUM]),
    isStaff: () => auth.hasRole(ROLE_GROUPS.STAFF),
    
    // Check if user has minimum role level
    hasMinimumRole: (requiredRole: UserRole) => {
      if (!auth.user) return false;
      return hasMinimumRole(auth.user.role as UserRole, requiredRole);
    },
    
    // Get user's role level
    getRoleLevel: () => {
      if (!auth.user) return 0;
      const roleHierarchy = {
        [ROLES.ADMIN]: 4,
        [ROLES.MODERATOR]: 3,
        [ROLES.PREMIUM]: 2,
        [ROLES.BASIC]: 1,
      };
      return roleHierarchy[auth.user.role as UserRole] || 0;
    },
  };
}; 
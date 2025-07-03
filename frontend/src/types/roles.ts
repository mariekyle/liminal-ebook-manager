// User roles in the system
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  BASIC: 'basic',
  PREMIUM: 'premium',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Role hierarchy (higher roles have access to lower role permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [ROLES.ADMIN]: 4,
  [ROLES.MODERATOR]: 3,
  [ROLES.PREMIUM]: 2,
  [ROLES.BASIC]: 1,
};

// Helper function to check if a user has at least the required role level
export const hasMinimumRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Common role combinations
export const ROLE_GROUPS = {
  ADMIN_ONLY: [ROLES.ADMIN],
  STAFF: [ROLES.ADMIN, ROLES.MODERATOR],
  PREMIUM_AND_ABOVE: [ROLES.ADMIN, ROLES.MODERATOR, ROLES.PREMIUM],
  ALL_USERS: [ROLES.ADMIN, ROLES.MODERATOR, ROLES.PREMIUM, ROLES.BASIC],
} as const; 
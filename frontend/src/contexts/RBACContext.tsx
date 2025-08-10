/**
 * Enhanced RBAC Context Provider
 * Provides permission-based access control throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  Permission,
  Role,
  UserWithRBAC,
  PermissionContext,
  PermissionResult,
  PermissionCondition,
} from '../types/rbac';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface RBACContextType {
  user: UserWithRBAC | null;
  loading: boolean;

  // Permission checking methods
  hasPermission: (permission: string, context?: Partial<PermissionContext>) => boolean;
  hasAnyPermission: (permissions: string[], context?: Partial<PermissionContext>) => boolean;
  hasAllPermissions: (permissions: string[], context?: Partial<PermissionContext>) => boolean;
  checkPermission: (permission: string, context?: Partial<PermissionContext>) => PermissionResult;

  // Role management
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  getUserRoles: () => Role[];
  getEffectivePermissions: () => Permission[];

  // Utility methods
  canAccessResource: (resource: string, action: string, target?: any) => boolean;
  isSystemAdmin: () => boolean;
  isCompanyAdmin: (companyId?: string) => boolean;

  // Data refresh
  refreshUserPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserWithRBAC | null>(null);
  const [loading, setLoading] = useState(false);

  // Convert auth user to RBAC user and fetch detailed permissions
  useEffect(() => {
    if (isAuthenticated && authUser) {
      fetchUserPermissions(authUser.id);
    } else {
      setUser(null);
    }
  }, [isAuthenticated, authUser]);

  const fetchUserPermissions = async (userId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`http://localhost:5175/api/v1/users/${userId}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const rbacUser: UserWithRBAC = {
          ...data.user,
          effective_permissions: computeEffectivePermissions(
            data.user.roles,
            data.user.direct_permissions
          ),
        };
        setUser(rbacUser);
      } else {
        // Fallback to basic user with role-based permissions
        const basicUser: UserWithRBAC = {
          id: authUser?.id.toString() || '',
          email: authUser?.email || '',
          name: authUser?.name || '',
          company_id: authUser?.company || '',
          roles: convertLegacyRolesToRBAC(authUser?.roles || []),
          is_active: authUser?.active ?? true,
          created_at: authUser?.created_at || new Date().toISOString(),
          updated_at: authUser?.created_at || new Date().toISOString(),
        };
        basicUser.effective_permissions = computeEffectivePermissions(basicUser.roles, []);
        setUser(basicUser);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      toast.error('Failed to load user permissions');
    } finally {
      setLoading(false);
    }
  };

  // Convert legacy string roles to RBAC roles
  const convertLegacyRolesToRBAC = (roleNames: string[]): Role[] => {
    const { SYSTEM_ROLES } = require('../types/rbac');

    return roleNames.map((roleName) => {
      const systemRole = Object.values(SYSTEM_ROLES).find(
        (role: any) => role.name === roleName || role.id === roleName
      );

      if (systemRole) {
        return {
          id: systemRole.id || roleName,
          name: systemRole.name || roleName,
          display_name: systemRole.display_name || roleName,
          description: systemRole.description || `${roleName} role`,
          permissions: [], // Will be populated by backend
          is_system_role: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Role;
      }

      // Fallback for unknown roles
      return {
        id: roleName,
        name: roleName,
        display_name: roleName.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: `Legacy role: ${roleName}`,
        permissions: [],
        is_system_role: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  };

  // Compute effective permissions from roles and direct permissions
  const computeEffectivePermissions = (
    roles: Role[],
    directPermissions: Permission[] = []
  ): Permission[] => {
    const allPermissions = new Map<string, Permission>();

    // Add permissions from roles
    roles?.forEach((role) => {
      role.permissions?.forEach((permission) => {
        allPermissions.set(permission.id, permission);
      });
    });

    // Add direct permissions
    directPermissions?.forEach((permission) => {
      allPermissions.set(permission.id, permission);
    });

    return Array.from(allPermissions.values());
  };

  // Check if user has specific permission
  const hasPermission = (permission: string, context?: Partial<PermissionContext>): boolean => {
    return checkPermission(permission, context).allowed;
  };

  // Check detailed permission with conditions
  const checkPermission = (
    permission: string,
    context?: Partial<PermissionContext>
  ): PermissionResult => {
    if (!user || !user.effective_permissions) {
      return { allowed: false, reason: 'User not authenticated or no permissions loaded' };
    }

    // Find matching permissions
    const matchingPermissions = user.effective_permissions.filter((p) => {
      // Direct permission match
      if (p.id === permission) return true;

      // Wildcard permission match (e.g., 'system:*' matches 'system:admin')
      if (p.id.endsWith('*')) {
        const prefix = p.id.slice(0, -1);
        return permission.startsWith(prefix);
      }

      // Resource:action format match
      if (context?.resource && context?.action) {
        return p.resource === context.resource && p.action === context.action;
      }

      return false;
    });

    if (matchingPermissions.length === 0) {
      return { allowed: false, reason: 'No matching permissions found' };
    }

    // Check permission conditions
    for (const perm of matchingPermissions) {
      if (!perm.conditions || perm.conditions.length === 0) {
        return { allowed: true, matching_permissions: [perm] };
      }

      const conditionResults = evaluatePermissionConditions(perm.conditions, context, user);
      if (conditionResults.passed) {
        return { allowed: true, matching_permissions: [perm] };
      }
    }

    return {
      allowed: false,
      reason: 'Permission conditions not met',
      matching_permissions: matchingPermissions,
    };
  };

  // Evaluate permission conditions
  const evaluatePermissionConditions = (
    conditions: PermissionCondition[],
    context?: Partial<PermissionContext>,
    user?: UserWithRBAC | null
  ): { passed: boolean; failedConditions: PermissionCondition[] } => {
    const failedConditions: PermissionCondition[] = [];

    for (const condition of conditions) {
      let contextValue: any;

      // Get value from context
      if (condition.field === 'company_id') {
        contextValue = context?.company_id || user?.company_id;
      } else if (condition.field === 'user_id') {
        contextValue = user?.id;
      } else if (context?.target) {
        contextValue = context.target[condition.field];
      } else if (context?.additional_context) {
        contextValue = context.additional_context[condition.field];
      }

      // Evaluate condition
      const passed = evaluateCondition(contextValue, condition.operator, condition.value);
      if (!passed) {
        failedConditions.push(condition);
      }
    }

    return {
      passed: failedConditions.length === 0,
      failedConditions,
    };
  };

  // Evaluate individual condition
  const evaluateCondition = (contextValue: any, operator: string, expectedValue: any): boolean => {
    switch (operator) {
      case 'eq':
        return contextValue === expectedValue;
      case 'ne':
        return contextValue !== expectedValue;
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(contextValue);
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(contextValue);
      case 'gt':
        return contextValue > expectedValue;
      case 'lt':
        return contextValue < expectedValue;
      default:
        return false;
    }
  };

  // Check multiple permissions (any)
  const hasAnyPermission = (
    permissions: string[],
    context?: Partial<PermissionContext>
  ): boolean => {
    return permissions.some((permission) => hasPermission(permission, context));
  };

  // Check multiple permissions (all)
  const hasAllPermissions = (
    permissions: string[],
    context?: Partial<PermissionContext>
  ): boolean => {
    return permissions.every((permission) => hasPermission(permission, context));
  };

  // Check if user has specific role
  const hasRole = (roleName: string): boolean => {
    return user?.roles?.some((role) => role.name === roleName || role.id === roleName) || false;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some((roleName) => hasRole(roleName));
  };

  // Get user roles
  const getUserRoles = (): Role[] => {
    return user?.roles || [];
  };

  // Get effective permissions
  const getEffectivePermissions = (): Permission[] => {
    return user?.effective_permissions || [];
  };

  // Check resource access with action
  const canAccessResource = (resource: string, action: string, target?: any): boolean => {
    return hasPermission(`${resource}:${action}`, { resource, action, target });
  };

  // Check if user is system admin
  const isSystemAdmin = (): boolean => {
    return hasRole('system_admin') || hasPermission('system:admin');
  };

  // Check if user is company admin for specific company
  const isCompanyAdmin = (companyId?: string): boolean => {
    if (isSystemAdmin()) return true;

    const targetCompanyId = companyId || user?.company_id;
    return hasRole('company_admin') && (!targetCompanyId || user?.company_id === targetCompanyId);
  };

  // Refresh user permissions
  const refreshUserPermissions = async (): Promise<void> => {
    if (authUser) {
      await fetchUserPermissions(authUser.id);
    }
  };

  const contextValue: RBACContextType = useMemo(
    () => ({
      user,
      loading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      checkPermission,
      hasRole,
      hasAnyRole,
      getUserRoles,
      getEffectivePermissions,
      canAccessResource,
      isSystemAdmin,
      isCompanyAdmin,
      refreshUserPermissions,
    }),
    [user, loading]
  );

  return <RBACContext.Provider value={contextValue}>{children}</RBACContext.Provider>;
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

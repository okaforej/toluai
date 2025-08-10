/**
 * Permission Hooks
 * Provides convenient hooks for permission checking in functional components
 */

import { useMemo } from 'react';
import { useRBAC } from '../contexts/RBACContext';
import { PermissionContext, PermissionResult } from '../types/rbac';
import { PERMISSIONS } from '../types/rbac';

/**
 * usePermission - Hook for checking a single permission
 *
 * Example:
 * const canCreateUsers = usePermission('users:create');
 * const canEditUser = usePermission('users:update', { target: user });
 */
export const usePermission = (
  permission: string,
  context?: Partial<PermissionContext>
): boolean => {
  const { hasPermission } = useRBAC();

  return useMemo(() => {
    return hasPermission(permission, context);
  }, [hasPermission, permission, context]);
};

/**
 * usePermissions - Hook for checking multiple permissions
 *
 * Example:
 * const { canCreate, canUpdate, canDelete } = usePermissions({
 *   canCreate: 'users:create',
 *   canUpdate: 'users:update',
 *   canDelete: 'users:delete'
 * });
 */
export const usePermissions = <T extends Record<string, string>>(
  permissionMap: T,
  context?: Partial<PermissionContext>
): Record<keyof T, boolean> => {
  const { hasPermission } = useRBAC();

  return useMemo(() => {
    const result: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;

    for (const [key, permission] of Object.entries(permissionMap)) {
      result[key as keyof T] = hasPermission(permission, context);
    }

    return result;
  }, [hasPermission, permissionMap, context]);
};

/**
 * useDetailedPermission - Hook for detailed permission checking with conditions
 *
 * Example:
 * const userEditResult = useDetailedPermission('users:update', { target: user });
 * if (!userEditResult.allowed) {
 *   console.log('Access denied:', userEditResult.reason);
 * }
 */
export const useDetailedPermission = (
  permission: string,
  context?: Partial<PermissionContext>
): PermissionResult => {
  const { checkPermission } = useRBAC();

  return useMemo(() => {
    return checkPermission(permission, context);
  }, [checkPermission, permission, context]);
};

/**
 * useResourcePermissions - Hook for checking resource-based permissions
 *
 * Example:
 * const userPermissions = useResourcePermissions('users', user);
 * // Returns: { canRead: boolean, canCreate: boolean, canUpdate: boolean, canDelete: boolean }
 */
export const useResourcePermissions = (resource: string, target?: any) => {
  const { canAccessResource } = useRBAC();

  return useMemo(
    () => ({
      canRead: canAccessResource(resource, 'read', target),
      canCreate: canAccessResource(resource, 'create', target),
      canUpdate: canAccessResource(resource, 'update', target),
      canDelete: canAccessResource(resource, 'delete', target),
      canManage: canAccessResource(resource, 'manage', target),
    }),
    [canAccessResource, resource, target]
  );
};

/**
 * useRoleCheck - Hook for checking user roles
 *
 * Example:
 * const { isAdmin, isSystemAdmin } = useRoleCheck(['admin', 'system_admin']);
 */
export const useRoleCheck = (roles: string[]) => {
  const { hasRole, hasAnyRole } = useRBAC();

  return useMemo(() => {
    const result: Record<string, boolean> = {};

    // Individual role checks
    roles.forEach((role) => {
      const camelCaseKey = `is${role
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')}`;
      result[camelCaseKey] = hasRole(role);
    });

    // Combined checks
    result.hasAnyRole = hasAnyRole(roles);
    result.hasAllRoles = roles.every((role) => hasRole(role));

    return result;
  }, [hasRole, hasAnyRole, roles]);
};

/**
 * useUserPermissions - Hook for getting comprehensive user permission info
 *
 * Example:
 * const {
 *   user,
 *   isSystemAdmin,
 *   isCompanyAdmin,
 *   roles,
 *   permissions,
 *   canManageUsers,
 *   canManageCompanies
 * } = useUserPermissions();
 */
export const useUserPermissions = () => {
  const rbac = useRBAC();

  return useMemo(
    () => ({
      user: rbac.user,
      isSystemAdmin: rbac.isSystemAdmin(),
      isCompanyAdmin: rbac.isCompanyAdmin(),
      roles: rbac.getUserRoles(),
      permissions: rbac.getEffectivePermissions(),

      // Common permission checks
      canManageUsers: rbac.hasPermission(PERMISSIONS.USERS_MANAGE_ROLES),
      canManageCompanies: rbac.hasPermission(PERMISSIONS.COMPANIES_DELETE),
      canViewAllAssessments: rbac.hasPermission(PERMISSIONS.ASSESSMENTS_VIEW_ALL),
      canManageSystem: rbac.hasPermission(PERMISSIONS.SYSTEM_ADMIN),
      canAccessReferenceData: rbac.hasPermission(PERMISSIONS.SYSTEM_REFERENCE_DATA),
      canExportReports: rbac.hasPermission(PERMISSIONS.REPORTS_EXPORT),
    }),
    [rbac]
  );
};

/**
 * useConditionalPermission - Hook for permission checking with custom conditions
 *
 * Example:
 * const canEditUser = useConditionalPermission(
 *   'users:update',
 *   () => user.company_id === currentUser.company_id,
 *   [user.company_id, currentUser.company_id]
 * );
 */
export const useConditionalPermission = (
  permission: string,
  condition: () => boolean,
  dependencies: any[] = [],
  context?: Partial<PermissionContext>
): boolean => {
  const { hasPermission } = useRBAC();

  return useMemo(() => {
    const hasBasePermission = hasPermission(permission, context);
    const meetsCondition = condition();

    return hasBasePermission && meetsCondition;
  }, [hasPermission, permission, context, condition, ...dependencies]);
};

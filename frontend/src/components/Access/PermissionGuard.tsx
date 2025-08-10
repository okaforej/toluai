/**
 * Permission Guard Components
 * Provides declarative permission-based access control for UI components
 */

import React, { ReactNode } from 'react';
import { useRBAC } from '../../contexts/RBACContext';
import { PermissionContext } from '../../types/rbac';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // If true, requires ALL permissions; if false, requires ANY
  fallback?: ReactNode;
  resource?: string;
  action?: string;
  target?: any;
  context?: Partial<PermissionContext>;
  onDenied?: () => void;
}

/**
 * PermissionGuard - Conditionally renders children based on user permissions
 *
 * Examples:
 * <PermissionGuard permission="users:create">
 *   <CreateUserButton />
 * </PermissionGuard>
 *
 * <PermissionGuard permissions={["users:read", "users:update"]} requireAll={false}>
 *   <UserManagementPanel />
 * </PermissionGuard>
 *
 * <PermissionGuard resource="companies" action="delete" target={company} fallback={<div>Access Denied</div>}>
 *   <DeleteCompanyButton company={company} />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = true,
  fallback = null,
  resource,
  action,
  target,
  context = {},
  onDenied,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessResource } = useRBAC();

  const checkAccess = (): boolean => {
    // Resource/action based check
    if (resource && action) {
      return canAccessResource(resource, action, target);
    }

    // Single permission check
    if (permission) {
      return hasPermission(permission, { ...context, target });
    }

    // Multiple permissions check
    if (permissions.length > 0) {
      const checkFn = requireAll ? hasAllPermissions : hasAnyPermission;
      return checkFn(permissions, { ...context, target });
    }

    // No permissions specified - deny by default
    return false;
  };

  const hasAccess = checkAccess();

  if (!hasAccess) {
    if (onDenied) {
      onDenied();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  children: ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  onDenied?: () => void;
}

/**
 * RoleGuard - Conditionally renders children based on user roles
 *
 * Examples:
 * <RoleGuard role="system_admin">
 *   <SystemSettingsPanel />
 * </RoleGuard>
 *
 * <RoleGuard roles={["admin", "company_admin"]} requireAll={false}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  onDenied,
}) => {
  const { hasRole, hasAnyRole } = useRBAC();

  const checkAccess = (): boolean => {
    if (role) {
      return hasRole(role);
    }

    if (roles.length > 0) {
      return requireAll ? roles.every((r) => hasRole(r)) : hasAnyRole(roles);
    }

    return false;
  };

  const hasAccess = checkAccess();

  if (!hasAccess) {
    if (onDenied) {
      onDenied();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ConditionalAccessProps {
  children: ReactNode;
  condition: boolean;
  fallback?: ReactNode;
  onDenied?: () => void;
}

/**
 * ConditionalAccess - Generic conditional rendering component
 *
 * Example:
 * <ConditionalAccess
 *   condition={user.company_id === company.id}
 *   fallback={<div>You can only edit your own company</div>}
 * >
 *   <EditCompanyForm />
 * </ConditionalAccess>
 */
export const ConditionalAccess: React.FC<ConditionalAccessProps> = ({
  children,
  condition,
  fallback = null,
  onDenied,
}) => {
  if (!condition) {
    if (onDenied) {
      onDenied();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Higher-order component for permission-based access control
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallback?: ReactNode
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

// Higher-order component for role-based access control
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: string,
  fallback?: ReactNode
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <RoleGuard role={role} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

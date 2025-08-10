/**
 * Enhanced RBAC (Role-Based Access Control) System Types
 * Implements a comprehensive permission-based access control system
 */

// Permission structure - atomic units of access control
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string; // e.g., 'users', 'companies', 'assessments'
  action: string; // e.g., 'read', 'write', 'delete', 'manage'
  scope?: 'global' | 'company' | 'own'; // Permission scope
  conditions?: PermissionCondition[]; // Dynamic conditions
}

// Conditional permissions based on context
export interface PermissionCondition {
  field: string; // e.g., 'company_id', 'user_id', 'status'
  operator: 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'lt';
  value: any;
}

// Role structure with permissions and hierarchy
export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: Permission[];
  inherits_from?: string[]; // Role inheritance
  is_system_role: boolean;
  is_active: boolean;
  company_id?: string; // Company-specific roles
  created_at: string;
  updated_at: string;
}

// Enhanced user structure with detailed role information
export interface UserWithRBAC {
  id: string;
  email: string;
  name: string;
  company_id?: string;
  roles: Role[];
  direct_permissions?: Permission[]; // Additional permissions outside roles
  effective_permissions?: Permission[]; // Computed permissions cache
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Permission check context
export interface PermissionContext {
  resource: string;
  action: string;
  target?: any; // Target object (e.g., user being edited)
  company_id?: string;
  additional_context?: Record<string, any>;
}

// Permission evaluation result
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  matching_permissions?: Permission[];
  failed_conditions?: PermissionCondition[];
}

// Predefined system permissions
export const PERMISSIONS = {
  // User Management
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',
  USERS_VIEW_ALL_COMPANIES: 'users:view_all_companies',

  // Company Management
  COMPANIES_READ: 'companies:read',
  COMPANIES_CREATE: 'companies:create',
  COMPANIES_UPDATE: 'companies:update',
  COMPANIES_DELETE: 'companies:delete',
  COMPANIES_MANAGE_USERS: 'companies:manage_users',

  // Risk Assessments
  ASSESSMENTS_READ: 'assessments:read',
  ASSESSMENTS_CREATE: 'assessments:create',
  ASSESSMENTS_UPDATE: 'assessments:update',
  ASSESSMENTS_DELETE: 'assessments:delete',
  ASSESSMENTS_APPROVE: 'assessments:approve',
  ASSESSMENTS_VIEW_ALL: 'assessments:view_all',

  // Insured Entities
  ENTITIES_READ: 'entities:read',
  ENTITIES_CREATE: 'entities:create',
  ENTITIES_UPDATE: 'entities:update',
  ENTITIES_DELETE: 'entities:delete',
  ENTITIES_VIEW_ALL: 'entities:view_all',

  // System Administration
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_AUDIT: 'system:audit',
  SYSTEM_REFERENCE_DATA: 'system:reference_data',

  // Reports and Analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EXPORT: 'reports:export',

  // External Risk Signals
  EXTERNAL_RISK_VIEW: 'external_risk:view',
  EXTERNAL_RISK_MANAGE: 'external_risk:manage',
} as const;

// Predefined system roles with permissions
export const SYSTEM_ROLES = {
  SYSTEM_ADMIN: {
    id: 'system_admin',
    name: 'system_admin',
    display_name: 'System Administrator',
    description: 'Full system access across all companies and features',
    permissions: Object.values(PERMISSIONS),
  },

  COMPANY_ADMIN: {
    id: 'company_admin',
    name: 'company_admin',
    display_name: 'Company Administrator',
    description: 'Full access within company scope',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_MANAGE_ROLES,
      PERMISSIONS.COMPANIES_READ,
      PERMISSIONS.COMPANIES_UPDATE,
      PERMISSIONS.ASSESSMENTS_READ,
      PERMISSIONS.ASSESSMENTS_CREATE,
      PERMISSIONS.ASSESSMENTS_UPDATE,
      PERMISSIONS.ASSESSMENTS_DELETE,
      PERMISSIONS.ENTITIES_READ,
      PERMISSIONS.ENTITIES_CREATE,
      PERMISSIONS.ENTITIES_UPDATE,
      PERMISSIONS.ENTITIES_DELETE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_CREATE,
      PERMISSIONS.REPORTS_EXPORT,
    ],
  },

  RISK_ANALYST: {
    id: 'risk_analyst',
    name: 'risk_analyst',
    display_name: 'Risk Analyst',
    description: 'Risk assessment and analysis capabilities',
    permissions: [
      PERMISSIONS.ASSESSMENTS_READ,
      PERMISSIONS.ASSESSMENTS_CREATE,
      PERMISSIONS.ASSESSMENTS_UPDATE,
      PERMISSIONS.ENTITIES_READ,
      PERMISSIONS.ENTITIES_CREATE,
      PERMISSIONS.ENTITIES_UPDATE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.EXTERNAL_RISK_VIEW,
    ],
  },

  UNDERWRITER: {
    id: 'underwriter',
    name: 'underwriter',
    display_name: 'Underwriter',
    description: 'Underwriting and approval capabilities',
    permissions: [
      PERMISSIONS.ASSESSMENTS_READ,
      PERMISSIONS.ASSESSMENTS_APPROVE,
      PERMISSIONS.ENTITIES_READ,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },

  COMPLIANCE_OFFICER: {
    id: 'compliance_officer',
    name: 'compliance_officer',
    display_name: 'Compliance Officer',
    description: 'Compliance monitoring and audit access',
    permissions: [
      PERMISSIONS.SYSTEM_AUDIT,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.EXTERNAL_RISK_VIEW,
      PERMISSIONS.ASSESSMENTS_READ,
      PERMISSIONS.ENTITIES_READ,
    ],
  },

  VIEWER: {
    id: 'viewer',
    name: 'viewer',
    display_name: 'Viewer',
    description: 'Read-only access to relevant data',
    permissions: [
      PERMISSIONS.ASSESSMENTS_READ,
      PERMISSIONS.ENTITIES_READ,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
} as const;

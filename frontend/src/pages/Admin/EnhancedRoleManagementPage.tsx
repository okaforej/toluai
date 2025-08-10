/**
 * Enhanced Role Management Page with RBAC Integration
 * Provides comprehensive role and permission management
 */

import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  KeyIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useRBAC } from '../../contexts/RBACContext';
import { PermissionGuard } from '../Access/PermissionGuard';
import { usePermissions, useUserPermissions } from '../../hooks/usePermissions';
import { Role, Permission, UserWithRBAC, PERMISSIONS, SYSTEM_ROLES } from '../../types/rbac';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

interface EnhancedRoleManagementPageProps {}

const EnhancedRoleManagementPage: React.FC<EnhancedRoleManagementPageProps> = () => {
  const rbac = useRBAC();
  const { canManageUsers } = useUserPermissions();
  const {
    canCreate: canCreateRoles,
    canUpdate: canUpdateRoles,
    canDelete: canDeleteRoles,
  } = usePermissions({
    canCreate: PERMISSIONS.USERS_MANAGE_ROLES,
    canUpdate: PERMISSIONS.USERS_MANAGE_ROLES,
    canDelete: PERMISSIONS.USERS_MANAGE_ROLES,
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserWithRBAC[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRBAC | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'permissions'>('roles');

  useEffect(() => {
    if (canManageUsers) {
      loadAllData();
    }
  }, [canManageUsers]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchRoles(), fetchUsers(), fetchPermissions()]);
    } catch (error) {
      console.error('Error loading role management data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5175/api/v1/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        // Fallback to system roles
        const systemRoles = Object.values(SYSTEM_ROLES).map((role) => ({
          ...role,
          permissions: [], // Will be populated separately
          is_system_role: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as Role[];
        setRoles(systemRoles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5175/api/v1/users/with-permissions', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        // Fallback for development
        console.log('Using fallback user data');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5175/api/v1/permissions', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      } else {
        // Generate permissions from PERMISSIONS constant
        const systemPermissions: Permission[] = Object.entries(PERMISSIONS).map(([key, value]) => {
          const [resource, action] = value.split(':');
          return {
            id: value,
            name: key.toLowerCase().replace(/_/g, ' '),
            description: `${action} ${resource}`.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(),
            resource,
            action,
            scope: resource === 'system' ? 'global' : 'company',
          };
        });
        setPermissions(systemPermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to fetch permissions');
    }
  };

  const assignRole = async (userId: string, roleId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5175/api/v1/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role_id: roleId }),
      });

      if (response.ok) {
        toast.success('Role assigned successfully');
        await fetchUsers();
        setShowAssignModal(false);
        await rbac.refreshUserPermissions(); // Refresh current user permissions if needed
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    }
  };

  const removeRole = async (userId: string, roleId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5175/api/v1/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Role removed successfully');
        await fetchUsers();
        await rbac.refreshUserPermissions(); // Refresh current user permissions if needed
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove role');
      }
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    }
  };

  const createRole = async (roleData: Partial<Role>) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5175/api/v1/roles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      if (response.ok) {
        toast.success('Role created successfully');
        await fetchRoles();
        setShowRoleModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    }
  };

  const getRoleColor = (roleName: string): string => {
    const colors: Record<string, string> = {
      system_admin: 'bg-purple-100 text-purple-800 border-purple-200',
      company_admin: 'bg-blue-100 text-blue-800 border-blue-200',
      risk_analyst: 'bg-green-100 text-green-800 border-green-200',
      underwriter: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      compliance_officer: 'bg-orange-100 text-orange-800 border-orange-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const groupPermissionsByResource = (permissions: Permission[]) => {
    return permissions.reduce(
      (groups, permission) => {
        const resource = permission.resource || 'other';
        if (!groups[resource]) {
          groups[resource] = [];
        }
        groups[resource].push(permission);
        return groups;
      },
      {} as Record<string, Permission[]>
    );
  };

  // Check if user has access to this page
  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-sm text-gray-600 mt-2">
            You don't have permission to manage user roles.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Role Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage user roles and permissions with granular control
          </p>

          {/* User info display */}
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <span>Logged in as: {rbac.user?.name}</span>
            <span>•</span>
            <span>
              Roles:{' '}
              {rbac
                .getUserRoles()
                .map((r) => r.display_name)
                .join(', ')}
            </span>
          </div>
        </div>

        <PermissionGuard permission={PERMISSIONS.USERS_MANAGE_ROLES}>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowRoleModal(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Role
            </button>
          </div>
        </PermissionGuard>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'roles', label: 'Roles', icon: ShieldCheckIcon },
            { key: 'users', label: 'User Assignments', icon: UserGroupIcon },
            { key: 'permissions', label: 'Permissions', icon: KeyIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
              Available Roles ({roles.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              System and custom roles with their permissions
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{role.display_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {role.is_system_role && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                            System Role
                          </span>
                        )}
                        {!role.is_active && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => {
                          setSelectedRole(role);
                          setShowPermissionModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-800"
                        title="View Permissions"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <PermissionGuard permission={PERMISSIONS.USERS_MANAGE_ROLES}>
                        {!role.is_system_role && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRole(role);
                                setShowRoleModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-800"
                              title="Edit Role"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete the role "${role.display_name}"?`
                                  )
                                ) {
                                  // Implement delete role functionality
                                  toast.error('Role deletion not yet implemented');
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Role"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </PermissionGuard>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span>Permissions: {role.permissions?.length || 0}</span>
                    {role.company_id && <span> • Company Role</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2 text-primary-600" />
              User Role Assignments ({users.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">Assign and manage user roles</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No users found</p>
                      <p className="text-sm">User data will be populated from the API</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.company_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <span
                              key={role.id}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(role.name)}`}
                            >
                              {role.display_name}
                              <PermissionGuard permission={PERMISSIONS.USERS_MANAGE_ROLES}>
                                <button
                                  onClick={() => removeRole(user.id, role.id)}
                                  className="ml-1 hover:text-red-600"
                                  title="Remove Role"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                              </PermissionGuard>
                            </span>
                          )) || <span className="text-gray-500 text-sm">No roles assigned</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.effective_permissions?.length || 0} permissions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <PermissionGuard permission={PERMISSIONS.USERS_MANAGE_ROLES}>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowAssignModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-800"
                            title="Assign Role"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <KeyIcon className="w-5 h-5 mr-2 text-primary-600" />
              System Permissions ({permissions.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">Available permissions grouped by resource</p>
          </div>
          <div className="p-6">
            {Object.entries(groupPermissionsByResource(permissions)).map(
              ([resource, resourcePermissions]) => (
                <div key={resource} className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize flex items-center">
                    <Cog6ToothIcon className="w-5 h-5 mr-2 text-gray-500" />
                    {resource} ({resourcePermissions.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resourcePermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">{permission.name}</h4>
                            <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                                {permission.action}
                              </span>
                              {permission.scope && (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">
                                  {permission.scope}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Role to {selectedUser.name}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {roles
                .filter((role) => !selectedUser.roles?.some((r) => r.id === role.id))
                .map((role) => (
                  <button
                    key={role.id}
                    onClick={() => assignRole(selectedUser.id, role.id)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{role.display_name}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {role.permissions?.length || 0} permissions
                      {role.is_system_role && ' • System Role'}
                    </div>
                  </button>
                ))}
              {roles.filter((role) => !selectedUser.roles?.some((r) => r.id === role.id)).length ===
                0 && (
                <p className="text-center text-gray-500 py-4">
                  All available roles have been assigned to this user.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permission Details Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Permissions for {selectedRole.display_name}
              </h3>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                Object.entries(groupPermissionsByResource(selectedRole.permissions)).map(
                  ([resource, resourcePermissions]) => (
                    <div key={resource} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">{resource}</h4>
                      <div className="space-y-2">
                        {resourcePermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between py-1"
                          >
                            <span className="text-sm text-gray-700">{permission.name}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {permission.action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No permissions assigned to this role.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRoleManagementPage;

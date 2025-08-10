import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_system_role: boolean;
  permissions: string[];
}

interface UserWithRoles {
  id: number;
  name: string;
  email: string;
  company: string;
  roles: Role[];
}

const RoleManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5175/api/v1/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      }
    } catch (error) {
      toast.error('Failed to fetch roles');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5175/api/v1/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: number, roleId: number) => {
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
        fetchUsers();
        setShowAssignModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign role');
      }
    } catch (error) {
      toast.error('Failed to assign role');
    }
  };

  const removeRole = async (userId: number, roleId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5175/api/v1/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Role removed successfully');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove role');
      }
    } catch (error) {
      toast.error('Failed to remove role');
    }
  };

  const getRoleColor = (roleName: string) => {
    const colors: { [key: string]: string } = {
      system_admin: 'bg-purple-100 text-purple-800 border-purple-200',
      company_admin: 'bg-blue-100 text-blue-800 border-blue-200',
      risk_analyst: 'bg-green-100 text-green-800 border-green-200',
      underwriter: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      compliance_officer: 'bg-orange-100 text-orange-800 border-orange-200',
      read_only: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
      </div>

      {/* Available Roles */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
            Available Roles
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles?.map((role) => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{role.display_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    {role.is_system_role && (
                      <span className="inline-flex items-center px-2 py-1 mt-2 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                        System Role
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500">
                    Permissions: {role.permissions?.length || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Roles */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2 text-primary-600" />
            User Role Assignments
          </h2>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.company || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((role) => (
                        <span
                          key={role.id}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(role.name)}`}
                        >
                          {role.display_name}
                          {(user?.roles?.includes('system_admin') ||
                            user?.roles?.includes('company_admin')) && (
                            <button
                              onClick={() => removeRole(u.id, role.id)}
                              className="ml-1 hover:text-red-600"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(user?.roles?.includes('system_admin') ||
                      user?.roles?.includes('company_admin')) && (
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setShowAssignModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

            <div className="space-y-2">
              {roles
                ?.filter((role) => !selectedUser.roles?.some((r) => r.id === role.id))
                ?.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => assignRole(selectedUser.id, role.id)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{role.display_name}</div>
                    <div className="text-sm text-gray-600">{role.description}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;

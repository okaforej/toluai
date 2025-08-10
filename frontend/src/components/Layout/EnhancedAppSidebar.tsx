/**
 * Enhanced App Sidebar with RBAC Integration
 * Uses the new permission-based access control system
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  BugAntIcon,
  ScaleIcon,
  ChartBarIcon,
  MapPinIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import clsx from 'clsx';
import { useRBAC } from '../../contexts/RBACContext';
import { PermissionGuard } from '../Access/PermissionGuard';
import { PERMISSIONS } from '../../types/rbac';

const drawerWidth = 240;
const drawerCollapsedWidth = 64;

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path?: string;
  children?: NavigationItem[];
  // Instead of roles array, use specific permissions
  requiredPermissions?: string[];
  requireAllPermissions?: boolean; // Default: false (any permission)
  // Optional custom permission check function
  customPermissionCheck?: (rbac: ReturnType<typeof useRBAC>) => boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <HomeIcon className="w-5 h-5" />,
    path: '/dashboard',
    // Dashboard accessible to all authenticated users
  },
  {
    id: 'insured-entities',
    label: 'Insured',
    icon: <UserIcon className="w-5 h-5" />,
    path: '/insured-entities',
    requiredPermissions: [PERMISSIONS.ENTITIES_READ],
  },
  {
    id: 'risk-assessments',
    label: 'Risk Assessments',
    icon: <DocumentChartBarIcon className="w-5 h-5" />,
    path: '/risk-assessments',
    requiredPermissions: [PERMISSIONS.ASSESSMENTS_READ],
  },
  {
    id: 'external-risk',
    label: 'External Risk Signals',
    icon: <ShieldCheckIcon className="w-5 h-5" />,
    requiredPermissions: [PERMISSIONS.EXTERNAL_RISK_VIEW],
    children: [
      {
        id: 'cybersecurity',
        label: 'Cybersecurity Incidents',
        icon: <BugAntIcon className="w-4 h-4" />,
        path: '/external-risk/cybersecurity',
        requiredPermissions: [PERMISSIONS.EXTERNAL_RISK_VIEW],
      },
      {
        id: 'regulatory',
        label: 'Regulatory Compliance',
        icon: <ScaleIcon className="w-4 h-4" />,
        path: '/external-risk/regulatory',
        requiredPermissions: [PERMISSIONS.EXTERNAL_RISK_VIEW],
      },
      {
        id: 'market',
        label: 'Market Indicators',
        icon: <ArrowTrendingUpIcon className="w-4 h-4" />,
        path: '/external-risk/market',
        requiredPermissions: [PERMISSIONS.EXTERNAL_RISK_VIEW],
      },
    ],
  },
  {
    id: 'audit-logs',
    label: 'Audit & Logs',
    icon: <ClockIcon className="w-5 h-5" />,
    requiredPermissions: [PERMISSIONS.SYSTEM_AUDIT],
    children: [
      {
        id: 'user-activity',
        label: 'User Activity Log',
        icon: <ClipboardDocumentListIcon className="w-4 h-4" />,
        path: '/audit/user-activity',
        requiredPermissions: [PERMISSIONS.SYSTEM_AUDIT],
      },
      {
        id: 'data-access',
        label: 'Data Access Log',
        icon: <ShieldCheckIcon className="w-4 h-4" />,
        path: '/audit/data-access',
        requiredPermissions: [PERMISSIONS.SYSTEM_AUDIT],
      },
      {
        id: 'api-usage',
        label: 'API Usage Log',
        icon: <ArrowTrendingUpIcon className="w-4 h-4" />,
        path: '/audit/api-usage',
        requiredPermissions: [PERMISSIONS.SYSTEM_AUDIT],
      },
    ],
  },
  {
    id: 'reference-data',
    label: 'Reference Data',
    icon: <CircleStackIcon className="w-5 h-5" />,
    path: '/reference-data',
    requiredPermissions: [PERMISSIONS.SYSTEM_REFERENCE_DATA],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: <Cog6ToothIcon className="w-5 h-5" />,
    // Show if user has any admin permissions
    customPermissionCheck: (rbac) =>
      rbac.isSystemAdmin() ||
      rbac.isCompanyAdmin() ||
      rbac.hasAnyPermission([
        PERMISSIONS.USERS_READ,
        PERMISSIONS.COMPANIES_READ,
        PERMISSIONS.USERS_MANAGE_ROLES,
        PERMISSIONS.SYSTEM_SETTINGS,
      ]),
    children: [
      {
        id: 'users',
        label: 'Users',
        icon: <UsersIcon className="w-4 h-4" />,
        path: '/users',
        requiredPermissions: [PERMISSIONS.USERS_READ],
      },
      {
        id: 'companies',
        label: 'Companies',
        icon: <BuildingOfficeIcon className="w-4 h-4" />,
        path: '/companies',
        requiredPermissions: [PERMISSIONS.COMPANIES_READ],
        customPermissionCheck: (rbac) => rbac.isSystemAdmin(), // Only system admin
      },
      {
        id: 'role-management',
        label: 'Role Management',
        icon: <UserGroupIcon className="w-4 h-4" />,
        path: '/admin/roles',
        requiredPermissions: [PERMISSIONS.USERS_MANAGE_ROLES],
      },
      {
        id: 'rule-management',
        label: 'Rule Management',
        icon: <DocumentChartBarIcon className="w-4 h-4" />,
        path: '/admin/rules',
        requiredPermissions: [PERMISSIONS.ASSESSMENTS_UPDATE], // Rules affect assessments
      },
      {
        id: 'system-settings',
        label: 'System Settings',
        icon: <Cog6ToothIcon className="w-4 h-4" />,
        path: '/settings',
        requiredPermissions: [PERMISSIONS.SYSTEM_SETTINGS],
      },
    ],
  },
];

interface EnhancedAppSidebarProps {
  open: boolean;
  onToggle: () => void;
  variant?: 'persistent' | 'temporary';
}

const EnhancedAppSidebar: React.FC<EnhancedAppSidebarProps> = ({
  open,
  onToggle,
  variant = 'persistent',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const rbac = useRBAC();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'external-risk',
    'audit-logs',
    'admin',
  ]);

  const handleItemClick = (item: NavigationItem) => {
    if (item.children) {
      toggleExpanded(item.id);
    } else if (item.path) {
      navigate(item.path);
      if (variant === 'temporary') {
        onToggle();
      }
    }
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const isItemSelected = (item: NavigationItem): boolean => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return false;
  };

  // Check if user has access to navigation item
  const hasAccessToItem = (item: NavigationItem): boolean => {
    // Custom permission check takes precedence
    if (item.customPermissionCheck) {
      return item.customPermissionCheck(rbac);
    }

    // If no permissions specified, allow access (public item)
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }

    // Check required permissions
    const checkFn = item.requireAllPermissions ? rbac.hasAllPermissions : rbac.hasAnyPermission;

    return checkFn(item.requiredPermissions);
  };

  // Filter navigation items based on permissions
  const getFilteredNavigationItems = (): NavigationItem[] => {
    return navigationItems.filter((item) => {
      if (!hasAccessToItem(item)) {
        return false;
      }

      // Filter children based on permissions
      if (item.children) {
        item.children = item.children.filter((child) => hasAccessToItem(child));
        // Hide parent if no children are accessible
        if (item.children.length === 0) {
          return false;
        }
      }

      return true;
    });
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isSelected = isItemSelected(item);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = Boolean(item.children);

    return (
      <React.Fragment key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={clsx(
            'w-full flex items-center px-3 py-2.5 mx-2 mb-1 rounded-lg text-sm font-medium transition-all duration-200',
            'hover:bg-gray-100',
            isSelected
              ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
              : 'text-gray-700',
            level > 0 ? 'ml-6' : ''
          )}
          style={{ width: open ? 'calc(100% - 16px)' : 'auto' }}
        >
          <div
            className={clsx('flex items-center justify-center', open ? 'min-w-[40px]' : 'w-full')}
          >
            <span className={isSelected ? 'text-primary-600' : 'text-gray-500'}>{item.icon}</span>
          </div>

          {open && (
            <>
              <span
                className={clsx(
                  'flex-1 text-left ml-3',
                  isSelected ? 'font-semibold' : 'font-normal'
                )}
              >
                {item.label}
              </span>
              {hasChildren && (
                <span className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </span>
              )}
            </>
          )}

          {!open && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {item.label}
            </div>
          )}
        </button>

        {hasChildren && open && (
          <Transition
            show={isExpanded}
            enter="transition-all duration-200 ease-out"
            enterFrom="max-h-0 opacity-0"
            enterTo="max-h-96 opacity-100"
            leave="transition-all duration-150 ease-in"
            leaveFrom="max-h-96 opacity-100"
            leaveTo="max-h-0 opacity-0"
          >
            <div className="overflow-hidden">
              {item.children?.map((child) => renderNavigationItem(child, level + 1))}
            </div>
          </Transition>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className={clsx(
          'flex items-center border-b border-gray-200',
          open ? 'justify-between px-4 py-3' : 'justify-center px-2 py-3',
          'min-h-[60px]'
        )}
      >
        {open && (
          <div>
            <h2 className="text-lg font-bold text-primary-700">IRPA</h2>
            <p className="text-xs text-gray-500 -mt-1">v2.1.0</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {open ? (
            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1">
          {getFilteredNavigationItems().map((item) => renderNavigationItem(item))}
        </nav>
      </div>

      {/* User Info & Footer */}
      {open && (
        <div className="border-t border-gray-200 p-4">
          {rbac.user && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-900 truncate">{rbac.user.name}</p>
              <p className="text-xs text-gray-500 truncate">{rbac.user.email}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {rbac
                  .getUserRoles()
                  .slice(0, 2)
                  .map((role) => (
                    <span
                      key={role.id}
                      className="text-xs bg-primary-100 text-primary-700 px-1 rounded"
                    >
                      {role.display_name}
                    </span>
                  ))}
                {rbac.getUserRoles().length > 2 && (
                  <span className="text-xs text-gray-500">+{rbac.getUserRoles().length - 2}</span>
                )}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">© 2024 ToluAI</p>
        </div>
      )}
    </div>
  );

  if (variant === 'temporary') {
    return (
      <>
        {/* Overlay */}
        <Transition
          show={open}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onToggle} />
        </Transition>

        {/* Mobile Drawer */}
        <Transition
          show={open}
          enter="transition-transform duration-300"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition-transform duration-200"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <aside
            className="fixed top-0 left-0 h-full z-50 md:hidden shadow-xl border-r border-gray-200"
            style={{ width: drawerWidth }}
          >
            {drawerContent}
          </aside>
        </Transition>
      </>
    );
  }

  return (
    <aside
      className={clsx(
        'hidden md:block fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30',
        'shadow-sm'
      )}
      style={{
        width: open ? drawerWidth : drawerCollapsedWidth,
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {drawerContent}
    </aside>
  );
};

export default EnhancedAppSidebar;

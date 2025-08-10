import React, { useState, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Disclosure, Transition, Dialog } from '@headlessui/react';
import {
  HomeIcon,
  UserGroupIcon,
  UserIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
  ClockIcon,
  BugAntIcon,
  ScaleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  TagIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  UserIcon as UserSolidIcon,
  DocumentChartBarIcon as DocumentChartBarSolidIcon,
  ShieldCheckIcon as ShieldCheckSolidIcon,
  CircleStackIcon as CircleStackSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
  BuildingOffice2Icon as BuildingOffice2SolidIcon,
  ClockIcon as ClockSolidIcon,
} from '@heroicons/react/24/solid';

const sidebarWidth = 240;
const sidebarCollapsedWidth = 64;

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  solidIcon?: React.ComponentType<React.ComponentProps<'svg'>>;
  path?: string;
  children?: NavigationItem[];
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    solidIcon: HomeSolidIcon,
    path: '/dashboard',
  },
  {
    id: 'insured-entities',
    label: 'Insured',
    icon: UserIcon,
    solidIcon: UserSolidIcon,
    path: '/insured-entities',
  },
  // AI: IGNORE - Risk Assessments page temporarily hidden
  // {
  //   id: 'risk-assessments',
  //   label: 'Risk Assessments',
  //   icon: DocumentChartBarIcon,
  //   solidIcon: DocumentChartBarSolidIcon,
  //   path: '/risk-assessments',
  // },
  // AI: IGNORE - External Risk Signals section temporarily hidden
  // {
  //   id: 'external-risk',
  //   label: 'External Risk Signals',
  //   icon: ShieldCheckIcon,
  //   solidIcon: ShieldCheckSolidIcon,
  //   children: [
  //     {
  //       id: 'cybersecurity',
  //       label: 'Cybersecurity Incidents',
  //       icon: BugAntIcon,
  //       path: '/external-risk/cybersecurity',
  //     },
  //     {
  //       id: 'regulatory',
  //       label: 'Regulatory Compliance',
  //       icon: ScaleIcon,
  //       path: '/external-risk/regulatory',
  //     },
  //     {
  //       id: 'market',
  //       label: 'Market Indicators',
  //       icon: ChartBarIcon,
  //       path: '/external-risk/market',
  //     },
  //   ],
  // },
  // AI: IGNORE - Audit & Logs section temporarily hidden
  // {
  //   id: 'audit-logs',
  //   label: 'Audit & Logs',
  //   icon: ClockIcon,
  //   solidIcon: ClockSolidIcon,
  //   children: [
  //     {
  //       id: 'user-activity',
  //       label: 'User Activity Log',
  //       icon: DocumentTextIcon,
  //       path: '/audit/user-activity',
  //     },
  //     {
  //       id: 'data-access',
  //       label: 'Data Access Log',
  //       icon: ShieldCheckIcon,
  //       path: '/audit/data-access',
  //     },
  //     {
  //       id: 'api-usage',
  //       label: 'API Usage Log',
  //       icon: ChartBarIcon,
  //       path: '/audit/api-usage',
  //     },
  //   ],
  // },
  {
    id: 'reference-data',
    label: 'Reference Data',
    icon: CircleStackIcon,
    solidIcon: CircleStackSolidIcon,
    path: '/reference-data',
    roles: ['admin', 'system_admin'],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Cog6ToothIcon,
    solidIcon: Cog6ToothSolidIcon,
    children: [
      {
        id: 'users',
        label: 'Users',
        icon: UserGroupIcon,
        path: '/users',
        roles: ['system_admin', 'admin'],
      },
      {
        id: 'companies',
        label: 'Companies',
        icon: BuildingOffice2Icon,
        path: '/companies',
        roles: ['system_admin'],
      },
      {
        id: 'role-management',
        label: 'Role Management',
        icon: UsersIcon,
        path: '/admin/roles',
      },
      {
        id: 'rule-management',
        label: 'Rule Management',
        icon: DocumentTextIcon,
        path: '/admin/rules',
      },
      {
        id: 'system-settings',
        label: 'System Settings',
        icon: Cog6ToothIcon,
        path: '/settings',
      },
    ],
    roles: ['admin'],
  },
];

interface AppSidebarProps {
  open: boolean;
  onToggle: () => void;
  variant?: 'persistent' | 'temporary';
}

const AppSidebar: React.FC<AppSidebarProps> = ({ open, onToggle, variant = 'persistent' }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    // 'external-risk', // Hidden
    // 'audit-logs', // Hidden
    'admin',
  ]);

  // Check if user is admin
  const isAdmin =
    user?.roles?.includes('admin') ||
    user?.roles?.includes('administrator') ||
    user?.roles?.includes('system_admin');

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

  const hasRequiredRoles = (item: NavigationItem): boolean => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    if (!user?.roles) {
      return false;
    }

    return item.roles.some((role) => user.roles?.includes(role));
  };

  const getFilteredNavigationItems = () => {
    return navigationItems.filter((item) => {
      if (item.id === 'admin' && !isAdmin) {
        return false;
      }

      if (!hasRequiredRoles(item)) {
        return false;
      }

      if (item.children) {
        item.children = item.children.filter((child) => hasRequiredRoles(child));
      }

      return true;
    });
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isSelected = isItemSelected(item);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = Boolean(item.children);

    // Choose the appropriate icon (solid if selected, outline otherwise)
    const IconComponent = isSelected && item.solidIcon ? item.solidIcon : item.icon;

    if (hasChildren) {
      return (
        <Disclosure key={item.id} defaultOpen={isExpanded}>
          {({ open: disclosureOpen }) => (
            <>
              <Disclosure.Button
                className={`
                  w-full group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${
                    isSelected
                      ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${!open ? 'justify-center' : ''}
                `}
                onClick={() => toggleExpanded(item.id)}
              >
                <IconComponent className={`flex-shrink-0 h-5 w-5 ${!open ? '' : 'mr-3'}`} />
                {open && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {disclosureOpen || isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5" />
                    )}
                  </>
                )}
              </Disclosure.Button>

              {open && (
                <Disclosure.Panel className="space-y-1">
                  {item.children?.map((child) => renderNavigationItem(child, level + 1))}
                </Disclosure.Panel>
              )}
            </>
          )}
        </Disclosure>
      );
    }

    const navigationButton = (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={`
          w-full group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
          ${level > 0 ? 'ml-6' : ''}
          ${
            isSelected
              ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600 font-semibold'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
          ${!open ? 'justify-center' : ''}
        `}
      >
        <IconComponent className={`flex-shrink-0 h-5 w-5 ${!open ? '' : 'mr-3'}`} />
        {open && <span className="truncate">{item.label}</span>}
      </button>
    );

    // If sidebar is collapsed, wrap in tooltip
    if (!open) {
      return (
        <div key={item.id} className="relative group">
          {navigationButton}
          <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            {item.label}
          </div>
        </div>
      );
    }

    return navigationButton;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white">
      {/* Logo and Toggle */}
      <div
        className={`p-4 flex items-center ${open ? 'justify-between' : 'justify-center'} min-h-16 border-b border-gray-200`}
      >
        {open && <h1 className="text-xl font-bold text-primary-600">ToluAI</h1>}
        {variant === 'persistent' && (
          <button
            onClick={onToggle}
            className="p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {open ? (
              <ChevronLeftIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {getFilteredNavigationItems().map((item) => renderNavigationItem(item))}
      </div>

      {/* User Section */}
      {open && user && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
            <div className="flex-shrink-0">
              <UserIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.roles?.[0] || 'User'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Mobile sidebar (temporary variant)
  if (variant === 'temporary') {
    return (
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onToggle}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={onToggle}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                {sidebarContent}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }

  // Desktop sidebar (persistent variant)
  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out
        ${open ? 'w-60' : 'w-16'}
        border-r border-gray-200
      `}
      style={{ width: open ? sidebarWidth : sidebarCollapsedWidth }}
    >
      {sidebarContent}
    </div>
  );
};

export default AppSidebar;

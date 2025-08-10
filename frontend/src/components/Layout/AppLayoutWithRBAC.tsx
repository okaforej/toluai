/**
 * Enhanced App Layout with RBAC Integration
 * Provides the main application layout with permission-based access control
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import EnhancedAppSidebar from './EnhancedAppSidebar';
import { RBACProvider } from '../../contexts/RBACContext';
// import { PermissionGuard } from '../Access/PermissionGuard';
import { useRBAC } from '../../contexts/RBACContext';
import LoadingSpinner from '../UI/LoadingSpinner';

interface AppLayoutWithRBACProps {}

const AppLayoutContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const rbac = useRBAC();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (rbac.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <EnhancedAppSidebar open={sidebarOpen} onToggle={toggleSidebar} variant="persistent" />

      {/* Mobile Sidebar */}
      <EnhancedAppSidebar open={sidebarOpen} onToggle={toggleSidebar} variant="temporary" />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-60' : 'md:ml-16'
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="ml-2 text-xl font-semibold text-gray-900 md:hidden">IRPA</h1>
            </div>

            {/* User Info in Header */}
            <div className="flex items-center space-x-4">
              {rbac.user && (
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{rbac.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {rbac
                        .getUserRoles()
                        .map((r) => r.display_name)
                        .join(', ') || 'No roles'}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-sm">
                      {rbac.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const AppLayoutWithRBAC: React.FC<AppLayoutWithRBACProps> = () => {
  return (
    <RBACProvider>
      <AppLayoutContent />
    </RBACProvider>
  );
};

export default AppLayoutWithRBAC;

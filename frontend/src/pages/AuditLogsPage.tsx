import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { irpaAuditAPI, irpaUtils } from '../services/irpaApi';
import { UserActivityLog, DataAccessLog } from '../types/irpa';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const AuditLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activity' | 'data_access'>('activity');
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [dataAccessLogs, setDataAccessLogs] = useState<DataAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');

  const tabs = [
    { id: 'activity', label: 'User Activity', icon: UserIcon },
    { id: 'data_access', label: 'Data Access', icon: ShieldCheckIcon },
  ];

  const activityTypes = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

  const dataTypes = ['COMPANY', 'INSURED_ENTITY', 'RISK_ASSESSMENT', 'USER', 'SYSTEM'];

  useEffect(() => {
    fetchLogs();
  }, [activeTab, currentPage, selectedUser, selectedType, dateRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      if (activeTab === 'activity') {
        const response = await irpaAuditAPI.getActivityLog({
          page: currentPage,
          per_page: 20,
          user_id: selectedUser !== 'all' ? selectedUser : undefined,
          activity_type: selectedType !== 'all' ? selectedType : undefined,
        });

        setActivityLogs(response.activity_logs || []);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        const response = await irpaAuditAPI.getDataAccessLog({
          page: currentPage,
          per_page: 20,
          user_id: selectedUser !== 'all' ? selectedUser : undefined,
          data_type: selectedType !== 'all' ? selectedType : undefined,
        });

        setDataAccessLogs(response.data_access_logs || []);
        setTotalPages(response.pagination?.pages || 1);
      }

      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to fetch audit logs');
      setActivityLogs([]);
      setDataAccessLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'create':
        return '🆕';
      case 'read':
        return '👁️';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'login':
        return '🔑';
      case 'logout':
        return '🚪';
      default:
        return '📋';
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'create':
        return 'text-green-600 bg-green-100';
      case 'read':
        return 'text-blue-600 bg-blue-100';
      case 'update':
        return 'text-yellow-600 bg-yellow-100';
      case 'delete':
        return 'text-red-600 bg-red-100';
      case 'login':
        return 'text-purple-600 bg-purple-100';
      case 'logout':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'critical':
        return 'text-red-700 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor user activities and system access</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'activity' | 'data_access');
                  setCurrentPage(1);
                }}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Users</option>
                {/* In a real implementation, you would populate this with actual users */}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">
                  {activeTab === 'activity' ? 'All Activities' : 'All Data Types'}
                </option>
                {(activeTab === 'activity' ? activityTypes : dataTypes).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Logs Content */}
        {activeTab === 'activity' && (
          <div className="divide-y divide-gray-200">
            {activityLogs.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900">No activity logs found</p>
                <p className="text-sm text-gray-500">
                  No user activities match your current filters
                </p>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.log_id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(log.activity_type)}`}
                      >
                        <span className="text-lg">{getActivityIcon(log.activity_type)}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(log.activity_type)}`}
                        >
                          {log.activity_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {log.entity_type && `on ${log.entity_type}`}
                        </span>
                      </div>

                      <p className="text-sm text-gray-900 mt-1">
                        User performed {log.activity_type.toLowerCase()} action
                        {log.entity_type && ` on ${log.entity_type.toLowerCase()}`}
                        {log.entity_id && ` (ID: ${log.entity_id.toString().slice(-8)})`}
                      </p>

                      {log.action_details && Object.keys(log.action_details).length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">Details:</p>
                          <pre className="text-xs text-gray-700 bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.action_details, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          User ID: {log.user_id.toString().slice(-8)}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {irpaUtils.formatDateTime(log.timestamp)}
                        </span>
                        {log.ip_address && (
                          <span className="flex items-center">
                            <ComputerDesktopIcon className="w-4 h-4 mr-1" />
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Data Access Logs Content */}
        {activeTab === 'data_access' && (
          <div className="divide-y divide-gray-200">
            {dataAccessLogs.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <ShieldCheckIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900">No data access logs found</p>
                <p className="text-sm text-gray-500">
                  No data access activities match your current filters
                </p>
              </div>
            ) : (
              dataAccessLogs.map((log) => (
                <div key={log.log_id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(log.access_type)}`}
                      >
                        <DocumentTextIcon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(log.access_type)}`}
                        >
                          {log.access_type}
                        </span>
                        <span className="text-sm text-gray-500">{log.data_type}</span>
                      </div>

                      <p className="text-sm text-gray-900 mt-1">
                        {log.access_type} access to {log.data_type.toLowerCase()} data
                        {log.entity_id && ` (ID: ${log.entity_id.toString().slice(-8)})`}
                      </p>

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          User ID: {log.user_id.toString().slice(-8)}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {irpaUtils.formatDateTime(log.timestamp)}
                        </span>
                        {log.ip_address && (
                          <span className="flex items-center">
                            <ComputerDesktopIcon className="w-4 h-4 mr-1" />
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg border border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + Math.max(1, currentPage - 2);
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;

import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/UI/LoadingSpinner';

interface ScheduledRule {
  id: string;
  name: string;
  description: string;
  rule_set: string;
  schedule_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
  schedule_expression: string;
  next_execution: string | null;
  last_execution: string | null;
  status: 'active' | 'paused' | 'stopped' | 'error';
  created_at: string;
  created_by: string;
  execution_count: number;
  success_count: number;
  failure_count: number;
  average_duration_ms: number;
  parameters?: Record<string, any>;
}

const RuleSchedulingPage: React.FC = () => {
  const [scheduledRules, setScheduledRules] = useState<ScheduledRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ScheduledRule | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data for demonstration
  const mockScheduledRules: ScheduledRule[] = [
    {
      id: '1',
      name: 'Daily Risk Assessment',
      description: 'Run comprehensive risk assessment for all active entities',
      rule_set: 'risk_assessment_v2.1.0',
      schedule_type: 'daily',
      schedule_expression: '0 2 * * *', // Daily at 2 AM
      next_execution: '2024-01-20T02:00:00Z',
      last_execution: '2024-01-19T02:00:00Z',
      status: 'active',
      created_at: '2024-01-01T10:00:00Z',
      created_by: 'admin@toluai.com',
      execution_count: 19,
      success_count: 18,
      failure_count: 1,
      average_duration_ms: 45000,
      parameters: {
        include_inactive: false,
        batch_size: 100,
        notification_emails: ['admin@toluai.com'],
      },
    },
    {
      id: '2',
      name: 'Weekly Compliance Report',
      description: 'Generate weekly compliance reports for all companies',
      rule_set: 'compliance_rules_v1.5.2',
      schedule_type: 'weekly',
      schedule_expression: '0 9 * * 1', // Mondays at 9 AM
      next_execution: '2024-01-22T09:00:00Z',
      last_execution: '2024-01-15T09:00:00Z',
      status: 'active',
      created_at: '2024-01-01T12:00:00Z',
      created_by: 'compliance@toluai.com',
      execution_count: 3,
      success_count: 3,
      failure_count: 0,
      average_duration_ms: 120000,
      parameters: {
        report_format: 'pdf',
        include_charts: true,
        email_recipients: ['compliance@toluai.com', 'management@toluai.com'],
      },
    },
    {
      id: '3',
      name: 'Monthly Data Validation',
      description: 'Validate data integrity across all entities',
      rule_set: 'data_validation_v1.3.0',
      schedule_type: 'monthly',
      schedule_expression: '0 0 1 * *', // First day of month at midnight
      next_execution: '2024-02-01T00:00:00Z',
      last_execution: '2024-01-01T00:00:00Z',
      status: 'paused',
      created_at: '2023-12-15T15:30:00Z',
      created_by: 'data-admin@toluai.com',
      execution_count: 1,
      success_count: 0,
      failure_count: 1,
      average_duration_ms: 0,
      parameters: {
        validation_level: 'strict',
        auto_fix: false,
      },
    },
  ];

  useEffect(() => {
    fetchScheduledRules();
  }, [filterStatus]);

  const fetchScheduledRules = async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let filteredRules = mockScheduledRules;
      if (filterStatus !== 'all') {
        filteredRules = filteredRules.filter((rule) => rule.status === filterStatus);
      }

      setScheduledRules(filteredRules);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch scheduled rules');
      setScheduledRules([]);
    } finally {
      setLoading(false);
    }
  };

  const updateRuleStatus = async (ruleId: string, newStatus: string) => {
    try {
      // In a real implementation, call API to update status
      await new Promise((resolve) => setTimeout(resolve, 500));

      setScheduledRules((prev) =>
        prev.map((rule) =>
          rule.id === ruleId ? { ...rule, status: newStatus as ScheduledRule['status'] } : rule
        )
      );

      setSuccess(
        `Rule ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'stopped'} successfully`
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to ${newStatus} rule`);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      // In a real implementation, call API to delete rule
      await new Promise((resolve) => setTimeout(resolve, 500));

      setScheduledRules((prev) => prev.filter((rule) => rule.id !== ruleId));
      setSuccess('Rule deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to delete rule');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'stopped':
        return 'text-gray-600 bg-gray-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScheduleDescription = (rule: ScheduledRule) => {
    switch (rule.schedule_type) {
      case 'daily':
        return 'Daily at 2:00 AM';
      case 'weekly':
        return 'Weekly on Mondays at 9:00 AM';
      case 'monthly':
        return 'Monthly on the 1st at midnight';
      case 'once':
        return `Once at ${new Date(rule.schedule_expression).toLocaleString()}`;
      default:
        return rule.schedule_expression;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
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
          <h1 className="text-2xl font-bold text-gray-900">Rule Scheduling</h1>
          <p className="text-sm text-gray-600 mt-1">Schedule and manage automated rule execution</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Schedule Rule
        </button>
      </div>

      {/* Status Messages */}
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="stopped">Stopped</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Scheduled Rules */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scheduled Rules</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {scheduledRules.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No scheduled rules found</p>
              <p className="text-sm text-gray-500">
                Create your first scheduled rule to get started
              </p>
            </div>
          ) : (
            scheduledRules.map((rule) => (
              <div key={rule.id} className="px-6 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rule.status)}`}
                      >
                        {rule.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <CalendarIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">Schedule</span>
                        </div>
                        <p className="text-sm text-gray-700">{getScheduleDescription(rule)}</p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <ClockIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">Next Execution</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {formatDateTime(rule.next_execution)}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Cog6ToothIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">Rule Set</span>
                        </div>
                        <p className="text-sm text-gray-700">{rule.rule_set}</p>
                      </div>
                    </div>

                    {/* Execution Statistics */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{rule.execution_count}</p>
                        <p className="text-xs text-gray-600">Total Runs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{rule.success_count}</p>
                        <p className="text-xs text-gray-600">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{rule.failure_count}</p>
                        <p className="text-xs text-gray-600">Failed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatDuration(rule.average_duration_ms)}
                        </p>
                        <p className="text-xs text-gray-600">Avg Duration</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created by {rule.created_by}</span>
                      <span>Last run: {formatDateTime(rule.last_execution)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    {rule.status === 'paused' && (
                      <button
                        onClick={() => updateRuleStatus(rule.id, 'active')}
                        className="p-2 text-green-400 hover:text-green-600 rounded-full hover:bg-green-100"
                        title="Resume"
                      >
                        <PlayIcon className="w-5 h-5" />
                      </button>
                    )}

                    {rule.status === 'active' && (
                      <button
                        onClick={() => updateRuleStatus(rule.id, 'paused')}
                        className="p-2 text-yellow-400 hover:text-yellow-600 rounded-full hover:bg-yellow-100"
                        title="Pause"
                      >
                        <PauseIcon className="w-5 h-5" />
                      </button>
                    )}

                    {(rule.status === 'active' || rule.status === 'paused') && (
                      <button
                        onClick={() => updateRuleStatus(rule.id, 'stopped')}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Stop"
                      >
                        <StopIcon className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedRule(rule);
                        // In a real app, open edit modal
                        alert('Edit functionality coming soon');
                      }}
                      className="p-2 text-blue-400 hover:text-blue-600 rounded-full hover:bg-blue-100"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${rule.name}"?`)) {
                          deleteRule(rule.id);
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-100"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Schedule New Rule</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900">Schedule Rule Form</p>
                <p className="text-sm text-gray-500 mt-2">
                  This is a placeholder. The full scheduling form will include:
                </p>
                <ul className="text-sm text-gray-500 mt-2 text-left max-w-md mx-auto">
                  <li>• Rule set selection</li>
                  <li>• Schedule type (daily, weekly, monthly, cron)</li>
                  <li>• Time and date configuration</li>
                  <li>• Parameter configuration</li>
                  <li>• Notification settings</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleSchedulingPage;

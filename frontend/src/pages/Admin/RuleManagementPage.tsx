import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/risk';

interface RiskRule {
  id: number;
  name: string;
  description: string;
  rule_type: 'global' | 'company';
  company_id: number | null;
  conditions: any;
  actions: any;
  priority: number;
  is_active: boolean;
  scheduled_activation: string | null;
  scheduled_deactivation: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  audit_logs?: any[];
}

interface RuleTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  template_conditions: any;
  template_actions: any;
}

const RuleManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [selectedRule, setSelectedRule] = useState<RiskRule | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedRules, setExpandedRules] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'global' | 'company'>('all');

  const isSystemAdmin = user?.roles?.includes('system_admin');
  const isCompanyAdmin = user?.roles?.includes('company_admin');
  const canCreateRules = isSystemAdmin || isCompanyAdmin;

  useEffect(() => {
    fetchRules();
    fetchTemplates();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/rules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data.rules);
      }
    } catch (error) {
      toast.error('Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/rules/templates', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates');
    }
  };

  const toggleRule = async (ruleId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/rules/${ruleId}/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Rule status updated');
        fetchRules();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to toggle rule');
      }
    } catch (error) {
      toast.error('Failed to toggle rule');
    }
  };

  const filteredRules = rules.filter((rule) => {
    if (activeTab === 'all') return true;
    return rule.rule_type === activeTab;
  });

  const toggleExpanded = (ruleId: number) => {
    setExpandedRules((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Rule Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage risk assessment rules</p>
        </div>
        {canCreateRules && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Rule
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-8">
          {['all', 'global', 'company'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                {tab === 'global' && <GlobeAltIcon className="w-4 h-4 mr-1" />}
                {tab === 'company' && <BuildingOfficeIcon className="w-4 h-4 mr-1" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Rules
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {rules.filter((r) => tab === 'all' || r.rule_type === tab).length}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <button onClick={() => toggleExpanded(rule.id)} className="mr-2">
                      {expandedRules.includes(rule.id) ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                    <span
                      className={`ml-3 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        rule.rule_type === 'global'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <span className="mr-1">
                        {rule.rule_type === 'global' ? (
                          <GlobeAltIcon className="w-3 h-3" />
                        ) : (
                          <BuildingOfficeIcon className="w-3 h-3" />
                        )}
                      </span>
                      {rule.rule_type}
                    </span>
                    {rule.is_active ? (
                      <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                        Active
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    {rule.version > 1 && (
                      <span className="ml-2 text-xs text-gray-500">v{rule.version}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{rule.description}</p>

                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>Priority: {rule.priority}</span>
                    <span>•</span>
                    <span>Created: {formatDate(rule.created_at)}</span>
                    {rule.scheduled_activation && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Activates: {formatDate(rule.scheduled_activation)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {canCreateRules && (
                    <>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.is_active
                            ? 'text-warning-600 hover:bg-warning-50'
                            : 'text-success-600 hover:bg-success-50'
                        }`}
                        title={rule.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {rule.is_active ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRule(rule);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRules.includes(rule.id) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Conditions</h4>
                      <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(rule.conditions, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
                      <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(rule.actions, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {rule.audit_logs && rule.audit_logs.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Changes</h4>
                      <div className="space-y-2">
                        {rule.audit_logs.slice(0, 3).map((log, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center">
                            <span className="font-medium">{log.action}</span>
                            <span className="mx-2">•</span>
                            <span>User {log.user_id}</span>
                            <span className="mx-2">•</span>
                            <span>{formatDate(log.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredRules.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rules found</h3>
            <p className="text-sm text-gray-600">
              {canCreateRules
                ? 'Get started by creating your first rule.'
                : 'No rules have been configured yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleManagementPage;

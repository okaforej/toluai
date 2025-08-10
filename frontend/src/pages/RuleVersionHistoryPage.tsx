import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  TagIcon,
  UserIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowPathRoundedSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/UI/LoadingSpinner';

interface RuleVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  change_summary: string;
  rule_content: string;
  deployment_status: 'deployed' | 'pending' | 'failed' | 'rolled_back';
  performance_metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    execution_time_ms: number;
  };
  testing_results?: {
    passed: number;
    failed: number;
    total: number;
  };
}

const RuleVersionHistoryPage: React.FC = () => {
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<RuleVersion | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRule, setSelectedRule] = useState<string>('all');

  // Mock data for demonstration
  const mockVersions: RuleVersion[] = [
    {
      id: '1',
      version: 'v2.1.0',
      name: 'Enhanced Risk Assessment Rules',
      description:
        'Updated risk calculation algorithm with improved accuracy for financial sector assessments',
      status: 'active',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T11:45:00Z',
      author: {
        id: '1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@toluai.com',
      },
      change_summary:
        'Improved financial sector risk scoring, added new data validation rules, optimized performance by 25%',
      rule_content: `
// Enhanced Risk Assessment Rules v2.1.0
rule "High Risk Financial Assessment" {
  when:
    entity.sector == "Financial Services" and
    entity.annual_revenue > 100000000 and
    entity.regulatory_violations > 0
  then:
    riskScore += 15;
    addRecommendation("Conduct enhanced due diligence");
}
      `,
      deployment_status: 'deployed',
      performance_metrics: {
        accuracy: 94.2,
        precision: 91.8,
        recall: 96.5,
        execution_time_ms: 127,
      },
      testing_results: {
        passed: 245,
        failed: 3,
        total: 248,
      },
    },
    {
      id: '2',
      version: 'v2.0.3',
      name: 'Bug Fix Release',
      description: 'Fixed edge case in healthcare sector risk calculations',
      status: 'inactive',
      created_at: '2024-01-10T14:20:00Z',
      updated_at: '2024-01-10T14:25:00Z',
      author: {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.chen@toluai.com',
      },
      change_summary:
        'Fixed null pointer exception in healthcare assessment, corrected age calculation logic',
      rule_content: `
// Bug Fix Release v2.0.3
rule "Healthcare Age Validation" {
  when:
    entity.sector == "Healthcare" and
    entity.practitioner_age != null and
    entity.practitioner_age < 25
  then:
    riskScore += 5;
    addWarning("Young practitioner - additional verification required");
}
      `,
      deployment_status: 'rolled_back',
      performance_metrics: {
        accuracy: 92.8,
        precision: 90.1,
        recall: 95.2,
        execution_time_ms: 134,
      },
      testing_results: {
        passed: 240,
        failed: 8,
        total: 248,
      },
    },
    {
      id: '3',
      version: 'v2.0.2',
      name: 'Performance Optimization',
      description: 'Optimized rule execution performance for large datasets',
      status: 'archived',
      created_at: '2024-01-05T09:15:00Z',
      updated_at: '2024-01-05T16:30:00Z',
      author: {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@toluai.com',
      },
      change_summary:
        'Optimized database queries, implemented caching mechanism, reduced memory usage by 30%',
      rule_content: `
// Performance Optimization v2.0.2
rule "Cached Risk Assessment" {
  when:
    entity.cache_key exists and
    cache.get(entity.cache_key) != null
  then:
    riskScore = cache.get(entity.cache_key);
    skipDetailedAnalysis();
}
      `,
      deployment_status: 'deployed',
      performance_metrics: {
        accuracy: 91.5,
        precision: 89.7,
        recall: 93.8,
        execution_time_ms: 89,
      },
      testing_results: {
        passed: 238,
        failed: 10,
        total: 248,
      },
    },
  ];

  useEffect(() => {
    fetchVersions();
  }, [filterStatus, selectedRule]);

  const fetchVersions = async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let filteredVersions = mockVersions;

      if (filterStatus !== 'all') {
        filteredVersions = filteredVersions.filter((v) => v.status === filterStatus);
      }

      setVersions(filteredVersions);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch rule versions');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'draft':
        return 'text-blue-600 bg-blue-100';
      case 'archived':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDeploymentStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'rolled_back':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rule Version History</h1>
        <p className="text-sm text-gray-600 mt-1">Track changes and manage rule versions</p>
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Rule Sets</option>
              <option value="risk_assessment">Risk Assessment Rules</option>
              <option value="validation">Validation Rules</option>
              <option value="scoring">Scoring Rules</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Version List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Version History</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {versions.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <TagIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No versions found</p>
              <p className="text-sm text-gray-500">No rule versions match your current filters</p>
            </div>
          ) : (
            versions.map((version) => (
              <div key={version.id} className="px-6 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <TagIcon className="w-5 h-5 text-primary-600" />
                        <span className="text-lg font-semibold text-gray-900">
                          {version.version}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(version.status)}`}
                      >
                        {version.status}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDeploymentStatusColor(version.deployment_status)}`}
                      >
                        {version.deployment_status}
                      </span>
                    </div>

                    <h4 className="text-lg font-medium text-gray-900 mb-2">{version.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{version.description}</p>

                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Change Summary:</h5>
                      <p className="text-sm text-gray-700">{version.change_summary}</p>
                    </div>

                    {/* Performance Metrics */}
                    {version.performance_metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {version.performance_metrics.accuracy}%
                          </p>
                          <p className="text-xs text-blue-600">Accuracy</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {version.performance_metrics.precision}%
                          </p>
                          <p className="text-xs text-green-600">Precision</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {version.performance_metrics.recall}%
                          </p>
                          <p className="text-xs text-purple-600">Recall</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-600">
                            {version.performance_metrics.execution_time_ms}ms
                          </p>
                          <p className="text-xs text-gray-600">Exec Time</p>
                        </div>
                      </div>
                    )}

                    {/* Testing Results */}
                    {version.testing_results && (
                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-gray-600">
                            {version.testing_results.passed} passed
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <XCircleIcon className="w-5 h-5 text-red-500" />
                          <span className="text-sm text-gray-600">
                            {version.testing_results.failed} failed
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            {version.testing_results.total} total tests
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-1" />
                        {version.author.name}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {formatDateTime(version.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => {
                        setSelectedVersion(version);
                        setShowDetails(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      title="View Details"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>

                    {version.status !== 'active' && version.deployment_status !== 'failed' && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to rollback to version ${version.version}?`
                            )
                          ) {
                            alert('Rollback functionality coming soon');
                          }
                        }}
                        className="p-2 text-blue-400 hover:text-blue-600 rounded-full hover:bg-blue-100"
                        title="Rollback to this version"
                      >
                        <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Version Details Modal */}
      {showDetails && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full m-4 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Version {selectedVersion.version} Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Rule Content:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {selectedVersion.rule_content}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Version Information:</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Version:</dt>
                        <dd className="font-medium">{selectedVersion.version}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Status:</dt>
                        <dd>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedVersion.status)}`}
                          >
                            {selectedVersion.status}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Deployment:</dt>
                        <dd>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDeploymentStatusColor(selectedVersion.deployment_status)}`}
                          >
                            {selectedVersion.deployment_status}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Created:</dt>
                        <dd>{formatDateTime(selectedVersion.created_at)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Author:</dt>
                        <dd>{selectedVersion.author.name}</dd>
                      </div>
                    </dl>
                  </div>

                  {selectedVersion.performance_metrics && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Performance Metrics:
                      </h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Accuracy:</dt>
                          <dd className="font-medium">
                            {selectedVersion.performance_metrics.accuracy}%
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Precision:</dt>
                          <dd className="font-medium">
                            {selectedVersion.performance_metrics.precision}%
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Recall:</dt>
                          <dd className="font-medium">
                            {selectedVersion.performance_metrics.recall}%
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Execution Time:</dt>
                          <dd className="font-medium">
                            {selectedVersion.performance_metrics.execution_time_ms}ms
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleVersionHistoryPage;

import React, { useState } from 'react';
import {
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatDate, getRiskBadgeColor, getStatusColor } from '../utils/risk';

interface RiskAssessment {
  id: string;
  entityName: string;
  entityId: string;
  company: string;
  assessmentType: string;
  riskScore: number;
  riskLevel: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  assessor: string;
  createdAt: string;
  completedAt: string | null;
  validUntil: string;
}

const RiskAssessmentsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');

  // Mock data
  const assessments: RiskAssessment[] = [
    {
      id: 'ASS001',
      entityName: 'Dr. Emily Johnson',
      entityId: 'ENT001',
      company: 'HealthCare Plus',
      assessmentType: 'Annual Review',
      riskScore: 25,
      riskLevel: 'Low Risk',
      status: 'completed',
      assessor: 'Jane Smith',
      createdAt: '2024-01-20',
      completedAt: '2024-01-20',
      validUntil: '2025-01-20',
    },
    {
      id: 'ASS002',
      entityName: 'Michael Chen',
      entityId: 'ENT002',
      company: 'TechCorp Solutions',
      assessmentType: 'Quarterly Review',
      riskScore: 45,
      riskLevel: 'Moderate Risk',
      status: 'in_progress',
      assessor: 'John Doe',
      createdAt: '2024-01-25',
      completedAt: null,
      validUntil: '2024-04-25',
    },
    {
      id: 'ASS003',
      entityName: 'Sarah Martinez',
      entityId: 'ENT003',
      company: 'FinanceHub Inc',
      assessmentType: 'Initial Assessment',
      riskScore: 72,
      riskLevel: 'High Risk',
      status: 'completed',
      assessor: 'Jane Smith',
      createdAt: '2024-01-15',
      completedAt: '2024-01-15',
      validUntil: '2024-07-15',
    },
    {
      id: 'ASS004',
      entityName: 'Robert Wilson',
      entityId: 'ENT004',
      company: 'TechCorp Solutions',
      assessmentType: 'Risk Review',
      riskScore: 0,
      riskLevel: 'Pending',
      status: 'pending',
      assessor: 'Unassigned',
      createdAt: '2024-01-26',
      completedAt: null,
      validUntil: '',
    },
  ];

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.assessmentType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || assessment.status === selectedStatus;
    const matchesRiskLevel =
      selectedRiskLevel === 'all' || assessment.riskLevel === selectedRiskLevel;
    return matchesSearch && matchesStatus && matchesRiskLevel;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-success-600" />;
      case 'in_progress':
        return <ArrowPathIcon className="w-5 h-5 text-primary-600 animate-spin" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-warning-600" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-error-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Assessments</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and review all risk assessment activities
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Assessment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{assessments.length}</p>
            </div>
            <DocumentChartBarIcon className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {assessments.filter((a) => a.status === 'completed').length}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-success-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {assessments.filter((a) => a.status === 'in_progress').length}
              </p>
            </div>
            <ArrowPathIcon className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">
                {assessments.filter((a) => a.status === 'pending').length}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-warning-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-error-600 mt-1">
                {assessments.filter((a) => a.riskLevel === 'High Risk').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-error-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Moderate Risk">Moderate Risk</option>
              <option value="High Risk">High Risk</option>
            </select>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <FunnelIcon className="w-5 h-5 mr-2" />
              More Filters
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{assessment.id}</div>
                    <div className="text-sm text-gray-500">{formatDate(assessment.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{assessment.entityName}</div>
                    <div className="text-sm text-gray-500">{assessment.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assessment.assessmentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(assessment.status)}
                      <span
                        className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assessment.status)}`}
                      >
                        {assessment.status.replace('_', ' ').charAt(0).toUpperCase() +
                          assessment.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {assessment.riskScore > 0 ? (
                      <div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(assessment.riskLevel)}`}
                        >
                          {assessment.riskLevel}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Score: {assessment.riskScore}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assessment.assessor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assessment.validUntil ? formatDate(assessment.validUntil) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-800">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {assessment.status === 'pending' && (
                        <button className="text-success-600 hover:text-success-800">
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                      {assessment.status === 'completed' && (
                        <button className="text-gray-600 hover:text-gray-800">
                          <ArrowPathIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentsPage;

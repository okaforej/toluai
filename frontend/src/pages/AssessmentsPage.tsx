import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { assessmentsAPI, clientsAPI } from '../services/api';
import { RiskAssessment, Client } from '../types';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AssessmentsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [clients, setClients] = useState<{ [key: number]: Client }>({});
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadAssessments();
  }, [riskFilter, typeFilter]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await assessmentsAPI.list({
        risk_category: riskFilter || undefined,
        per_page: 50,
      });

      setAssessments(response.assessments);

      // Load client data for assessments
      const clientIds = [...new Set(response.assessments.map((a) => a.client_id))];
      const clientPromises = clientIds.map((id) => clientsAPI.get(id));
      const clientResponses = await Promise.allSettled(clientPromises);

      const clientsMap: { [key: number]: Client } = {};
      clientResponses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          clientsMap[clientIds[index]] = result.value;
        }
      });

      setClients(clientsMap);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'reviewed':
        return 'blue';
      case 'approved':
        return 'purple';
      case 'draft':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'quick':
        return 'blue';
      case 'standard':
        return 'green';
      case 'detailed':
        return 'purple';
      case 'renewal':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    if (typeFilter && assessment.assessment_type !== typeFilter) return false;
    return true;
  });

  // Calculate summary stats
  const totalAssessments = assessments.length;
  const highRiskCount = assessments.filter(
    (a) => a.risk_category === 'high' || a.risk_category === 'critical'
  ).length;
  const pendingReviews = assessments.filter(
    (a) => a.status === 'completed' || a.status === 'draft'
  ).length;
  const avgRiskScore =
    assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.risk_score, 0) / assessments.length
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Assessments</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage risk assessments across your client portfolio
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{totalAssessments}</p>
              <p className="text-sm text-gray-600">Total Assessments</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{highRiskCount}</p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{pendingReviews}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{avgRiskScore.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Avg Risk Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Risk Level Filter */}
          <div className="relative">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Assessment Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="quick">Quick Assessment</option>
              <option value="standard">Standard Assessment</option>
              <option value="detailed">Detailed Assessment</option>
              <option value="renewal">Renewal Assessment</option>
            </select>
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Assessments List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredAssessments.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssessments.map((assessment) => {
                  const client = clients[assessment.client_id];
                  return (
                    <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Assessment #{assessment.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assessment.confidence * 100}% confidence
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {client.industry}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">Loading...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {assessment.risk_score.toFixed(1)}%
                          </div>
                          <Badge variant={getRiskBadgeVariant(assessment.risk_category)} size="sm">
                            {assessment.risk_category}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getTypeBadgeVariant(assessment.assessment_type)} size="sm">
                          {assessment.assessment_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(assessment.status)} size="sm">
                          {assessment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/assessments/${assessment.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <EyeIcon className="h-5 w-5 inline" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center h-16 w-16 bg-gray-100 rounded-full">
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
            <p className="text-gray-500 mb-6">
              {riskFilter || typeFilter
                ? 'Try adjusting your filters'
                : 'Assessments will appear here once you create them'}
            </p>
            <Link to="/clients">
              <button className="btn-primary">View Clients</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentsPage;

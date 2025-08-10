import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { clientsAPI, assessmentsAPI } from '../services/api';
import { Client, RiskAssessment } from '../types';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalClients: number;
  totalAssessments: number;
  highRiskClients: number;
  pendingReviews: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalAssessments: 0,
    highRiskClients: 0,
    pendingReviews: 0,
  });
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<RiskAssessment[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      console.log('Loading dashboard data...');

      // Load clients and assessments in parallel
      const [clientsResponse, assessmentsResponse] = await Promise.all([
        clientsAPI.list({ per_page: 5 }).catch((err) => {
          console.error('Clients API error:', err);
          throw new Error(`Clients API failed: ${err.response?.data?.error || err.message}`);
        }),
        assessmentsAPI.list({ per_page: 5 }).catch((err) => {
          console.error('Assessments API error:', err);
          throw new Error(`Assessments API failed: ${err.response?.data?.error || err.message}`);
        }),
      ]);

      console.log('Recent data loaded:', {
        clients: clientsResponse.clients?.length || 0,
        assessments: assessmentsResponse.assessments?.length || 0,
      });

      setRecentClients(clientsResponse.clients || []);
      setRecentAssessments(assessmentsResponse.assessments || []);

      // Calculate stats
      const allClientsResponse = await clientsAPI.list({ per_page: 1000 }).catch((err) => {
        console.error('All clients API error:', err);
        throw new Error(`All clients API failed: ${err.response?.data?.error || err.message}`);
      });

      const allAssessmentsResponse = await assessmentsAPI.list({ per_page: 1000 }).catch((err) => {
        console.error('All assessments API error:', err);
        throw new Error(`All assessments API failed: ${err.response?.data?.error || err.message}`);
      });

      const highRiskCount =
        allAssessmentsResponse.assessments?.filter(
          (a) => a.risk_category === 'high' || a.risk_category === 'critical'
        ).length || 0;

      const pendingCount =
        allAssessmentsResponse.assessments?.filter(
          (a) => a.status === 'draft' || a.status === 'pending'
        ).length || 0;

      const newStats = {
        totalClients:
          allClientsResponse.pagination?.total || allClientsResponse.clients?.length || 0,
        totalAssessments:
          allAssessmentsResponse.pagination?.total ||
          allAssessmentsResponse.assessments?.length ||
          0,
        highRiskClients: highRiskCount,
        pendingReviews: pendingCount,
      };

      console.log('Setting stats:', newStats);
      setStats(newStats);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      toast.error(`Failed to load dashboard data: ${errorMessage}`);
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
      default:
        return 'gray';
    }
  };

  // Mock data for charts
  const riskDistribution = [
    { name: 'Low Risk', value: 45, color: '#10b981' },
    { name: 'Medium Risk', value: 35, color: '#f59e0b' },
    { name: 'High Risk', value: 15, color: '#ef4444' },
    { name: 'Critical Risk', value: 5, color: '#dc2626' },
  ];

  const monthlyAssessments = [
    { month: 'Jan', assessments: 12 },
    { month: 'Feb', assessments: 19 },
    { month: 'Mar', assessments: 15 },
    { month: 'Apr', assessments: 25 },
    { month: 'May', assessments: 22 },
    { month: 'Jun', assessments: 30 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your risk assessments today.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.totalClients}</p>
              <p className="text-sm text-gray-600">Total Clients</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAssessments}</p>
              <p className="text-sm text-gray-600">Risk Assessments</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.highRiskClients}</p>
              <p className="text-sm text-gray-600">High Risk Clients</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReviews}</p>
              <p className="text-sm text-gray-600">Pending Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Risk Distribution</h3>
            <p className="text-sm text-gray-600">Current portfolio risk breakdown</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Assessments */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Assessments</h3>
            <p className="text-sm text-gray-600">Assessments completed over time</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyAssessments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assessments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Clients */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Clients</h3>
              <p className="text-sm text-gray-600">Latest client additions</p>
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="divide-y divide-gray-200">
            {recentClients.map((client) => (
              <div key={client.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.industry}</p>
                  </div>
                </div>
                <Badge variant={client.status === 'active' ? 'green' : 'gray'} size="sm">
                  {client.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Assessments */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Assessments</h3>
              <p className="text-sm text-gray-600">Latest risk assessments</p>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="divide-y divide-gray-200">
            {recentAssessments.map((assessment) => (
              <div key={assessment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Assessment #{assessment.id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRiskBadgeVariant(assessment.risk_category)} size="sm">
                      {assessment.risk_category}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(assessment.status)} size="sm">
                      {assessment.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

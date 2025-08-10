import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { assessmentsAPI, clientsAPI } from '../services/api';
import { RiskAssessment, Client, RiskFactor, Recommendation } from '../types';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AssessmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAssessmentData();
    }
  }, [id]);

  const loadAssessmentData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const assessmentResponse = await assessmentsAPI.get(parseInt(id));
      setAssessment(assessmentResponse);

      // Load client data
      const clientResponse = await clientsAPI.get(assessmentResponse.client_id);
      setClient(clientResponse);
    } catch (error) {
      console.error('Error loading assessment data:', error);
      toast.error('Failed to load assessment data');
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

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getFactorCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      industry: '#3b82f6',
      financial: '#10b981',
      operational: '#f59e0b',
      compliance: '#8b5cf6',
      market: '#ef4444',
      default: '#6b7280',
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!assessment || !client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment not found</h3>
        <p className="text-gray-500 mb-6">The requested assessment could not be found.</p>
        <Link to="/assessments">
          <Button variant="secondary">Back to Assessments</Button>
        </Link>
      </div>
    );
  }

  // Prepare data for charts
  const factorData =
    assessment.factors?.map((factor) => ({
      name: factor.factor_name,
      value: factor.factor_value,
      weight: factor.factor_weight,
      category: factor.factor_category,
      color: getFactorCategoryColor(factor.factor_category),
    })) || [];

  const categoryData =
    assessment.factors?.reduce((acc: any[], factor) => {
      const existing = acc.find((item) => item.category === factor.factor_category);
      if (existing) {
        existing.value += factor.factor_value * factor.factor_weight;
        existing.count += 1;
      } else {
        acc.push({
          category: factor.factor_category,
          value: factor.factor_value * factor.factor_weight,
          count: 1,
          color: getFactorCategoryColor(factor.factor_category),
        });
      }
      return acc;
    }, []) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/assessments">
            <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="h-5 w-5" />}>
              Back to Assessments
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment #{assessment.id}</h1>
            <p className="text-gray-600">
              {client.name} • {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={getStatusBadgeVariant(assessment.status)}>{assessment.status}</Badge>
          <Badge variant={assessment.assessment_type === 'quick' ? 'blue' : 'purple'}>
            {assessment.assessment_type}
          </Badge>
        </div>
      </div>

      {/* Risk Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {assessment.risk_score.toFixed(1)}%
              </div>
              <Badge
                variant={getRiskBadgeVariant(assessment.risk_category)}
                size="md"
                className="text-lg px-4 py-2"
              >
                {assessment.risk_category.toUpperCase()} RISK
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(assessment.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Risk Factors</p>
                <p className="text-2xl font-semibold text-gray-900">{assessment.total_factors}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Recommendations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {assessment.recommendations?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Assessment Info</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Assessed by</p>
                  <p className="text-sm font-medium text-gray-900">User #{assessment.user_id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Assessment Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(assessment.assessment_date), 'MMM d, yyyy at h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Model Version</p>
                  <p className="text-sm font-medium text-gray-900">v{assessment.model_version}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Client Info</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{client.industry}</p>
                </div>
              </div>
              <Link to={`/clients/${client.id}`}>
                <Button variant="ghost" size="sm" className="w-full">
                  View Client Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factor Analysis */}
      {assessment.factors && assessment.factors.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Factor Categories Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Risk Categories</h3>
              <p className="text-sm text-gray-600">Risk distribution by category</p>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ category, value }) => `${category} (${(value * 100).toFixed(1)}%)`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Individual Factors */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Risk Factor Impact</h3>
              <p className="text-sm text-gray-600">Individual factor contributions</p>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={factorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Impact Score']}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors Details */}
      {assessment.factors && assessment.factors.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Risk Factors ({assessment.factors.length})
            </h3>
            <p className="text-sm text-gray-600">Detailed analysis of identified risk factors</p>
          </div>
          <div className="divide-y divide-gray-200">
            {assessment.factors.map((factor, index) => (
              <div key={factor.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">{factor.factor_name}</h4>
                      <Badge variant="gray" size="sm">
                        {factor.factor_category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Weight: {(factor.factor_weight * 100).toFixed(1)}%</span>
                      <span>•</span>
                      <span>Impact: {(factor.impact_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {(factor.factor_value * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Risk Value</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-2 text-blue-500" />
              Recommendations ({assessment.recommendations.length})
            </h3>
            <p className="text-sm text-gray-600">AI-generated recommendations to mitigate risk</p>
          </div>
          <div className="divide-y divide-gray-200">
            {assessment.recommendations.map((recommendation) => (
              <div key={recommendation.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{recommendation.title}</h4>
                      <Badge variant={getPriorityBadgeVariant(recommendation.priority)} size="sm">
                        {recommendation.priority} priority
                      </Badge>
                      <Badge variant="gray" size="sm">
                        {recommendation.implementation_cost} cost
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {recommendation.recommendation_text}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Impact: {(recommendation.estimated_impact * 100).toFixed(0)}%</span>
                      <span>•</span>
                      <span>Category: {recommendation.category}</span>
                      <span>•</span>
                      <span>Status: {recommendation.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {assessment.notes && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Assessment Notes</h3>
          </div>
          <div className="card-body">
            <p className="text-gray-700 whitespace-pre-wrap">{assessment.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentDetailsPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { clientsAPI, assessmentsAPI } from '../services/api';
import { Client, RiskAssessment } from '../types';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [clientResponse, assessmentsResponse] = await Promise.all([
        clientsAPI.get(parseInt(id)),
        assessmentsAPI.list({ client_id: parseInt(id) }),
      ]);

      setClient(clientResponse);
      setAssessments(assessmentsResponse.assessments);
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssessment = async () => {
    if (!client) return;

    try {
      setAssessmentLoading(true);
      await assessmentsAPI.createQuick(client.id, 'Quick assessment from client details');
      toast.success('Assessment created successfully');
      loadClientData(); // Reload to show new assessment
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create assessment';
      toast.error(message);
    } finally {
      setAssessmentLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Client not found</h3>
        <p className="text-gray-500 mb-6">The requested client could not be found.</p>
        <Link to="/clients">
          <Button variant="secondary">Back to Clients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clients">
            <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="h-5 w-5" />}>
              Back to Clients
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">{client.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleQuickAssessment}
            loading={assessmentLoading}
            icon={<DocumentTextIcon className="h-5 w-5" />}
          >
            Run Assessment
          </Button>
          <Badge variant={client.status === 'active' ? 'green' : 'gray'}>{client.status}</Badge>
        </div>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {client.industry || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.phone || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{client.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.website ? (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                        >
                          {client.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Annual Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {client.annual_revenue
                      ? `$${client.annual_revenue.toLocaleString()}`
                      : 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Employees</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {client.employee_count || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Years in Business</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {client.years_in_business || 'Not specified'}
                  </p>
                </div>
              </div>

              {client.address && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {client.address}
                    {client.city && `, ${client.city}`}
                    {client.state && `, ${client.state}`}
                    {client.zip_code && ` ${client.zip_code}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Risk Summary</h3>
            </div>
            <div className="card-body text-center">
              {client.risk_score ? (
                <>
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {client.risk_score.toFixed(1)}%
                    </div>
                    <Badge variant={getRiskBadgeVariant(client.risk_category || '')} size="md">
                      {client.risk_category?.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Based on {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <div className="py-6">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 mb-4">No risk assessment available</p>
                  <Button size="sm" onClick={handleQuickAssessment} loading={assessmentLoading}>
                    Run Assessment
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Client since</span>
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(client.created_at), 'MMM yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Assessments</span>
                <span className="text-sm font-medium text-gray-900">{assessments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Client Type</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {client.client_type}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment History */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Assessment History</h3>
            <p className="text-sm text-gray-600">Risk assessments for this client</p>
          </div>
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
        </div>

        {assessments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        Assessment #{assessment.id}
                      </h4>
                      <Badge
                        variant={assessment.assessment_type === 'quick' ? 'blue' : 'purple'}
                        size="sm"
                      >
                        {assessment.assessment_type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{format(new Date(assessment.assessment_date), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <span>{assessment.confidence * 100}% confidence</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {assessment.risk_score.toFixed(1)}%
                      </div>
                      <Badge variant={getRiskBadgeVariant(assessment.risk_category)} size="sm">
                        {assessment.risk_category}
                      </Badge>
                    </div>
                    <Link
                      to={`/assessments/${assessment.id}`}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first risk assessment for this client
            </p>
            <Button
              onClick={handleQuickAssessment}
              loading={assessmentLoading}
              icon={<DocumentTextIcon className="h-5 w-5" />}
            >
              Run Assessment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailsPage;

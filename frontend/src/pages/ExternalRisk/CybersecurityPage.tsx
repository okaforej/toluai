import React from 'react';
import {
  BugAntIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { formatDate, getRiskBadgeColor } from '../../utils/risk';

const CybersecurityPage: React.FC = () => {
  const incidents = [
    {
      id: 'INC001',
      title: 'Data Breach Attempt Detected',
      severity: 'High',
      affectedCompany: 'TechCorp Solutions',
      date: '2024-01-25',
      status: 'resolved',
      description: 'Attempted SQL injection on customer database',
    },
    {
      id: 'INC002',
      title: 'Phishing Campaign Identified',
      severity: 'Medium',
      affectedCompany: 'FinanceHub Inc',
      date: '2024-01-24',
      status: 'monitoring',
      description: 'Email phishing targeting financial data',
    },
    {
      id: 'INC003',
      title: 'Malware Detection',
      severity: 'Low',
      affectedCompany: 'HealthCare Plus',
      date: '2024-01-23',
      status: 'resolved',
      description: 'Trojan detected in email attachment',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-error-100 text-error-800 border-error-200';
      case 'medium':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'low':
        return 'bg-success-100 text-success-800 border-success-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cybersecurity Incidents</h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitor and track cybersecurity threats and incidents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{incidents.length}</p>
            </div>
            <BugAntIcon className="w-8 h-8 text-error-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Severity</p>
              <p className="text-2xl font-bold text-error-600 mt-1">
                {incidents.filter((i) => i.severity === 'High').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-error-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Under Monitoring</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">
                {incidents.filter((i) => i.status === 'monitoring').length}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-warning-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {incidents.filter((i) => i.status === 'resolved').length}
              </p>
            </div>
            <ShieldCheckIcon className="w-8 h-8 text-success-600" />
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Cybersecurity Incidents</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {incidents.map((incident) => (
            <div key={incident.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <BugAntIcon className="w-5 h-5 text-error-600" />
                    <h3 className="text-sm font-medium text-gray-900">{incident.title}</h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(incident.severity)}`}
                    >
                      {incident.severity} Severity
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{incident.description}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>Company: {incident.affectedCompany}</span>
                    <span>•</span>
                    <span>Date: {formatDate(incident.date)}</span>
                    <span>•</span>
                    <span className="capitalize">Status: {incident.status}</span>
                  </div>
                </div>
                <button className="ml-4 text-primary-600 hover:text-primary-800">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Threat Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Threat Trends</h2>
          <ArrowTrendingUpIcon className="w-5 h-5 text-warning-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Most Common Attack</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">Phishing</p>
            <p className="text-sm text-warning-600 mt-2">↑ 23% this month</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg Response Time</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">4.2 hours</p>
            <p className="text-sm text-success-600 mt-2">↓ 15% improvement</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Prevention Rate</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">94.5%</p>
            <p className="text-sm text-success-600 mt-2">Above target</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CybersecurityPage;

import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { irpaAnalyticsAPI, irpaUtils } from '../services/irpaApi';
import LoadingSpinner from '../components/UI/LoadingSpinner';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'risk_assessment' | 'company_analysis' | 'trend_analysis' | 'compliance';
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  file_size?: number;
  download_url?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ComponentType<any>;
  color: string;
}

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'risk_distribution',
      name: 'Risk Distribution Report',
      description: 'Comprehensive analysis of risk levels across all entities',
      type: 'risk_assessment',
      icon: ChartPieIcon,
      color: 'bg-red-100 text-red-600',
    },
    {
      id: 'company_analysis',
      name: 'Company Analysis Report',
      description: 'Detailed analysis of company risk profiles and trends',
      type: 'company_analysis',
      icon: ChartBarIcon,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'trend_analysis',
      name: 'Trend Analysis Report',
      description: 'Historical trends and predictive analytics',
      type: 'trend_analysis',
      icon: PresentationChartLineIcon,
      color: 'bg-green-100 text-green-600',
    },
    {
      id: 'compliance_report',
      name: 'Compliance Report',
      description: 'Regulatory compliance status and recommendations',
      type: 'compliance',
      icon: DocumentTextIcon,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  useEffect(() => {
    fetchReports();
  }, [selectedType, selectedStatus, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Since there's no dedicated reports endpoint, we'll simulate with mock data
      // In a real implementation, you would call a reports API endpoint
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Monthly Risk Assessment Report - December 2024',
          description: 'Comprehensive risk analysis for December 2024',
          type: 'risk_assessment',
          status: 'completed',
          created_at: '2024-12-31T10:00:00Z',
          updated_at: '2024-12-31T10:30:00Z',
          file_size: 2500000,
          download_url: '/api/reports/1/download',
        },
        {
          id: '2',
          name: 'Company Analysis Report - Q4 2024',
          description: 'Quarterly company performance and risk analysis',
          type: 'company_analysis',
          status: 'completed',
          created_at: '2024-12-28T14:30:00Z',
          updated_at: '2024-12-28T15:15:00Z',
          file_size: 4200000,
          download_url: '/api/reports/2/download',
        },
        {
          id: '3',
          name: 'Trend Analysis Report - 2024',
          description: 'Annual trend analysis and predictions for 2025',
          type: 'trend_analysis',
          status: 'generating',
          created_at: '2025-01-05T09:00:00Z',
          updated_at: '2025-01-05T09:45:00Z',
        },
      ];

      // Filter reports based on selected filters
      let filteredReports = mockReports;
      if (selectedType !== 'all') {
        filteredReports = filteredReports.filter((report) => report.type === selectedType);
      }
      if (selectedStatus !== 'all') {
        filteredReports = filteredReports.filter((report) => report.status === selectedStatus);
      }

      setReports(filteredReports);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (templateId: string) => {
    try {
      setGeneratingReport(templateId);

      // In a real implementation, you would call the API to generate the report
      // For now, we'll simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const template = reportTemplates.find((t) => t.id === templateId);
      if (template) {
        const newReport: Report = {
          id: `${Date.now()}`,
          name: `${template.name} - ${new Date().toLocaleDateString()}`,
          description: template.description,
          type: template.type as Report['type'],
          status: 'generating',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setReports((prev) => [newReport, ...prev]);

        // Simulate report completion after a delay
        setTimeout(() => {
          setReports((prev) =>
            prev.map((report) =>
              report.id === newReport.id
                ? {
                    ...report,
                    status: 'completed',
                    file_size: Math.floor(Math.random() * 5000000) + 1000000,
                    download_url: `/api/reports/${newReport.id}/download`,
                  }
                : report
            )
          );
        }, 5000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const downloadReport = (report: Report) => {
    // In a real implementation, you would download the actual file
    alert(`Downloading ${report.name}...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'generating':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-600 mt-1">Generate and manage risk assessment reports</p>
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

      {/* Report Templates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            const isGenerating = generatingReport === template.id;

            return (
              <button
                key={template.id}
                onClick={() => generateReport(template.id)}
                disabled={isGenerating}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div
                  className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center mb-3`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
                {isGenerating && (
                  <div className="mt-2 flex items-center text-sm text-yellow-600">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Generating...</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="risk_assessment">Risk Assessment</option>
              <option value="company_analysis">Company Analysis</option>
              <option value="trend_analysis">Trend Analysis</option>
              <option value="compliance">Compliance</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Generated Reports</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {reports.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No reports found</p>
              <p className="text-sm text-gray-500">
                Generate your first report using the templates above
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {report.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">{report.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}
                          >
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created {irpaUtils.formatDateTime(report.created_at)}
                          </span>
                          {report.file_size && (
                            <span className="text-xs text-gray-500">
                              {formatFileSize(report.file_size)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {report.status === 'generating' && <LoadingSpinner size="small" />}

                    {report.status === 'completed' && (
                      <>
                        <button
                          onClick={() => alert(`Viewing ${report.name}`)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          title="View Report"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => downloadReport(report)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          title="Download Report"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

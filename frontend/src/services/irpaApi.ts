/**
 * IRPA (Insurance Risk Professional Assessment) API Service
 * Comprehensive API client for IRPA system
 */

import axios, { AxiosResponse } from 'axios';
import {
  IRPACompany,
  InsuredEntity,
  IRPARiskAssessment,
  CompaniesResponse,
  InsuredEntitiesResponse,
  AssessmentsResponse,
  ReferenceDataResponse,
  AnalyticsResponse,
  CreateCompanyForm,
  CreateInsuredEntityForm,
  RunAssessmentForm,
  ActivityLogsResponse,
  DataAccessLogsResponse,
  UserActivityLog,
  DataAccessLog,
  CybersecurityIncident,
  RegulatoryCompliance,
} from '../types/irpa';
import {
  mockIndustryTypes,
  mockStates,
  mockEducationLevels,
  mockJobTitles,
  mockPracticeFields,
  mockCompanies
} from '../data/mockReferenceData';

// Create IRPA API client
const irpaApiClient = axios.create({
  baseURL: '/api/v2/irpa',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
irpaApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
irpaApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Company Management API
export const irpaCompaniesAPI = {
  async list(params?: {
    page?: number;
    per_page?: number;
    industry_type_id?: number;
    state_id?: number;
    search?: string;
  }): Promise<CompaniesResponse> {
    try {
      const response: AxiosResponse<CompaniesResponse> = await irpaApiClient.get('/companies', {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn('Companies API not available, using mock data');
      return {
        companies: mockCompanies,
        pagination: {
          page: 1,
          pages: 1,
          per_page: mockCompanies.length,
          total: mockCompanies.length,
          has_next: false,
          has_prev: false,
        },
      };
    }
  },

  async create(data: CreateCompanyForm): Promise<{ message: string; company: IRPACompany }> {
    const response = await irpaApiClient.post('/companies', data);
    return response.data;
  },

  async get(companyId: string): Promise<IRPACompany> {
    const response: AxiosResponse<IRPACompany> = await irpaApiClient.get(`/companies/${companyId}`);
    return response.data;
  },

  async update(
    companyId: string,
    data: Partial<CreateCompanyForm>
  ): Promise<{ message: string; company: IRPACompany }> {
    const response = await irpaApiClient.put(`/companies/${companyId}`, data);
    return response.data;
  },

  async delete(companyId: string): Promise<{ message: string }> {
    const response = await irpaApiClient.delete(`/companies/${companyId}`);
    return response.data;
  },
};

// Insured Entity Management API
export const irpaInsuredEntitiesAPI = {
  async list(params?: {
    page?: number;
    per_page?: number;
    company_id?: string;
    entity_type?: string;
    search?: string;
  }): Promise<InsuredEntitiesResponse> {
    const response: AxiosResponse<InsuredEntitiesResponse> = await irpaApiClient.get(
      '/insured-entities',
      { params }
    );
    return response.data;
  },

  async create(
    data: CreateInsuredEntityForm
  ): Promise<{ message: string; insured_entity: InsuredEntity }> {
    try {
      const response = await irpaApiClient.post('/insured-entities', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('API endpoint not available. Please ensure the backend server is running.');
      }
      throw error;
    }
  },

  async get(insuredId: string): Promise<InsuredEntity> {
    const response: AxiosResponse<InsuredEntity> = await irpaApiClient.get(
      `/insured-entities/${insuredId}`
    );
    return response.data;
  },

  async update(
    insuredId: string,
    data: Partial<CreateInsuredEntityForm>
  ): Promise<{ message: string; insured_entity: InsuredEntity }> {
    try {
      const response = await irpaApiClient.put(`/insured-entities/${insuredId}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('API endpoint not available. Please ensure the backend server is running.');
      }
      throw error;
    }
  },

  async delete(insuredId: string): Promise<{ message: string }> {
    try {
      const response = await irpaApiClient.delete(`/insured-entities/${insuredId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('API endpoint not available. Please ensure the backend server is running.');
      }
      throw error;
    }
  },
};

// Risk Assessment API
export const irpaAssessmentsAPI = {
  async list(params?: {
    page?: number;
    per_page?: number;
    insured_id?: string;
    status?: string;
    risk_category?: string;
  }): Promise<AssessmentsResponse> {
    const response: AxiosResponse<AssessmentsResponse> = await irpaApiClient.get('/assessments', {
      params,
    });
    return response.data;
  },

  async run(data: RunAssessmentForm): Promise<{ message: string; assessment: IRPARiskAssessment }> {
    const response = await irpaApiClient.post('/assessments', data);
    return response.data;
  },

  async get(assessmentId: string): Promise<IRPARiskAssessment> {
    const response: AxiosResponse<IRPARiskAssessment> = await irpaApiClient.get(
      `/assessments/${assessmentId}`
    );
    return response.data;
  },

  async update(
    assessmentId: string,
    data: Partial<{ notes: string }>
  ): Promise<{ message: string; assessment: IRPARiskAssessment }> {
    const response = await irpaApiClient.put(`/assessments/${assessmentId}`, data);
    return response.data;
  },

  async delete(assessmentId: string): Promise<{ message: string }> {
    const response = await irpaApiClient.delete(`/assessments/${assessmentId}`);
    return response.data;
  },
};

// Reference Data API
export const irpaReferenceAPI = {
  async getIndustryTypes(): Promise<ReferenceDataResponse> {
    try {
      const response: AxiosResponse<ReferenceDataResponse> = await irpaApiClient.get(
        '/reference/industry-types'
      );
      return response.data;
    } catch (error) {
      console.warn('Industry types API not available, using mock data');
      return { industry_types: mockIndustryTypes };
    }
  },

  async getStates(): Promise<ReferenceDataResponse> {
    try {
      const response: AxiosResponse<ReferenceDataResponse> =
        await irpaApiClient.get('/reference/states');
      return response.data;
    } catch (error) {
      console.warn('States API not available, using mock data');
      return { states: mockStates };
    }
  },

  async getEducationLevels(): Promise<ReferenceDataResponse> {
    try {
      const response: AxiosResponse<ReferenceDataResponse> = await irpaApiClient.get(
        '/reference/education-levels'
      );
      return response.data;
    } catch (error) {
      console.warn('Education levels API not available, using mock data');
      return { education_levels: mockEducationLevels };
    }
  },

  async getJobTitles(): Promise<ReferenceDataResponse> {
    try {
      const response: AxiosResponse<ReferenceDataResponse> =
        await irpaApiClient.get('/reference/job-titles');
      return response.data;
    } catch (error) {
      console.warn('Job titles API not available, using mock data');
      return { job_titles: mockJobTitles };
    }
  },

  async getPracticeFields(): Promise<ReferenceDataResponse> {
    try {
      const response: AxiosResponse<ReferenceDataResponse> = await irpaApiClient.get(
        '/reference/practice-fields'
      );
      return response.data;
    } catch (error) {
      console.warn('Practice fields API not available, using mock data');
      return { practice_fields: mockPracticeFields };
    }
  },

  async getAllReferenceData(): Promise<{
    industry_types: any[];
    states: any[];
    education_levels: any[];
    job_titles: any[];
    practice_fields: any[];
  }> {
    try {
      const [industryTypes, states, educationLevels, jobTitles, practiceFields] = await Promise.all([
        this.getIndustryTypes(),
        this.getStates(),
        this.getEducationLevels(),
        this.getJobTitles(),
        this.getPracticeFields(),
      ]);

      return {
        industry_types: industryTypes.industry_types || [],
        states: states.states || [],
        education_levels: educationLevels.education_levels || [],
        job_titles: jobTitles.job_titles || [],
        practice_fields: practiceFields.practice_fields || [],
      };
    } catch (error) {
      console.warn('Reference API not available, using mock data');
      return {
        industry_types: mockIndustryTypes,
        states: mockStates,
        education_levels: mockEducationLevels,
        job_titles: mockJobTitles,
        practice_fields: mockPracticeFields,
      };
    }
  },
};

// Analytics and Reporting API
export const irpaAnalyticsAPI = {
  async getRiskDistribution(params?: { company_id?: string }): Promise<AnalyticsResponse> {
    const response: AxiosResponse<AnalyticsResponse> = await irpaApiClient.get(
      '/analytics/risk-distribution',
      { params }
    );
    return response.data;
  },

  async getAssessmentTrends(params?: {
    days?: number;
    company_id?: string;
  }): Promise<AnalyticsResponse> {
    const response: AxiosResponse<AnalyticsResponse> = await irpaApiClient.get(
      '/analytics/assessment-trends',
      { params }
    );
    return response.data;
  },
};

// Audit and Logging API
export const irpaAuditAPI = {
  async getActivityLog(params?: {
    page?: number;
    per_page?: number;
    user_id?: string;
    activity_type?: string;
  }): Promise<ActivityLogsResponse> {
    const response: AxiosResponse<ActivityLogsResponse> = await irpaApiClient.get(
      '/audit/activity',
      { params }
    );
    return response.data;
  },

  async getDataAccessLog(params?: {
    page?: number;
    per_page?: number;
    user_id?: string;
    data_type?: string;
    access_type?: string;
  }): Promise<DataAccessLogsResponse> {
    const response: AxiosResponse<DataAccessLogsResponse> = await irpaApiClient.get(
      '/audit/data-access',
      { params }
    );
    return response.data;
  },
};

// External Risk Data API (for future implementation)
export const irpaExternalRiskAPI = {
  async getCybersecurityIncidents(params?: {
    page?: number;
    per_page?: number;
    company_id?: string;
    severity_level?: number;
  }): Promise<{ cybersecurity_incidents: CybersecurityIncident[] }> {
    const response = await irpaApiClient.get('/external-risk/cybersecurity-incidents', { params });
    return response.data;
  },

  async getRegulatoryCompliance(params?: {
    page?: number;
    per_page?: number;
    company_id?: string;
    compliance_status?: string;
  }): Promise<{ regulatory_compliance: RegulatoryCompliance[] }> {
    const response = await irpaApiClient.get('/external-risk/regulatory-compliance', { params });
    return response.data;
  },
};

// Utility functions
export const irpaUtils = {
  formatRiskScore(score?: number): string {
    if (score === undefined || score === null) return 'N/A';
    return `${score.toFixed(1)}`;
  },

  getRiskCategoryColor(category: string): string {
    switch (category.toLowerCase()) {
      case 'low':
      case 'low risk':
        return 'text-green-800 bg-green-100 border-green-200';
      case 'medium':
      case 'moderate':
      case 'moderate risk':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'high':
      case 'high risk':
        return 'text-orange-800 bg-orange-100 border-orange-200';
      case 'critical':
      case 'critical risk':
        return 'text-red-800 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  },

  getRiskCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🟠';
      case 'critical':
        return '🔴';
      default:
        return '⚪';
    }
  },

  formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  formatPercentage(value?: number): string {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  },

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  formatDateTime(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  getDataCompletenessColor(score?: number): string {
    if (score === undefined || score === null) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  },

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'compliant':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'failed':
      case 'non-compliant':
        return 'text-red-600 bg-red-100';
      case 'new':
      case 'draft':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },
};

export default {
  companies: irpaCompaniesAPI,
  insuredEntities: irpaInsuredEntitiesAPI,
  assessments: irpaAssessmentsAPI,
  reference: irpaReferenceAPI,
  analytics: irpaAnalyticsAPI,
  audit: irpaAuditAPI,
  externalRisk: irpaExternalRiskAPI,
  utils: irpaUtils,
};

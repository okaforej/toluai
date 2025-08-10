import axios, { AxiosResponse } from 'axios';
import {
  User,
  Client,
  RiskAssessment,
  AuthResponse,
  ClientsResponse,
  AssessmentsResponse,
} from '../types';
import { mockLogin, shouldUseMockAuth } from './mockAuth';

const API_BASE_URL = '/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            {
              headers: { Authorization: `Bearer ${refreshToken}` },
            }
          );

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Check if we should use mock authentication
    if (shouldUseMockAuth()) {
      console.log('Using mock authentication');
      return mockLogin(email, password);
    }
    
    // Try real API first
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      // If backend is not available, fall back to mock auth
      if (error.code === 'ERR_NETWORK' || error.response?.status === 500) {
        console.log('Backend unavailable, falling back to mock authentication');
        return mockLogin(email, password);
      }
      throw error;
    }
  },

  refresh: async (): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

// Clients API
export const clientsAPI = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    industry?: string;
  }): Promise<ClientsResponse> => {
    const response: AxiosResponse<ClientsResponse> = await api.get('/clients', {
      params,
    });
    return response.data;
  },

  get: async (id: number): Promise<Client> => {
    const response: AxiosResponse<Client> = await api.get(`/clients/${id}`);
    return response.data;
  },

  create: async (data: Partial<Client>): Promise<Client> => {
    const response: AxiosResponse<Client> = await api.post('/clients', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Client>): Promise<Client> => {
    const response: AxiosResponse<Client> = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

// Assessments API
// Reference Data API
// Create a separate axios instance for v2 API
const apiV2 = axios.create({
  baseURL: '/api/v2',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor for v2 API
apiV2.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const referenceDataAPI = {
  getIndustryTypes: async (): Promise<any[]> => {
    const response = await apiV2.get('/irpa/reference/industry-types');
    return response.data.industry_types || [];
  },

  getStates: async (): Promise<any[]> => {
    const response = await apiV2.get('/irpa/reference/states');
    return response.data.states || [];
  },

  getEducationLevels: async (): Promise<any[]> => {
    const response = await apiV2.get('/irpa/reference/education-levels');
    return response.data.education_levels || [];
  },

  getJobTitles: async (): Promise<any[]> => {
    const response = await apiV2.get('/irpa/reference/job-titles');
    return response.data.job_titles || [];
  },

  getPracticeFields: async (): Promise<any[]> => {
    const response = await apiV2.get('/irpa/reference/practice-fields');
    return response.data.practice_fields || [];
  },
};

// Assessments API
export const assessmentsAPI = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    client_id?: number;
    risk_category?: string;
  }): Promise<AssessmentsResponse> => {
    const response: AxiosResponse<AssessmentsResponse> = await api.get('/assessments', {
      params,
    });
    return response.data;
  },

  get: async (id: number): Promise<RiskAssessment> => {
    const response: AxiosResponse<RiskAssessment> = await api.get(`/assessments/${id}`);
    return response.data;
  },

  create: async (data: {
    client_id: number;
    assessment_type: string;
    notes?: string;
  }): Promise<RiskAssessment> => {
    const response: AxiosResponse<RiskAssessment> = await api.post('/assessments', data);
    return response.data;
  },

  createQuick: async (clientId: number, notes?: string): Promise<RiskAssessment> => {
    const response: AxiosResponse<RiskAssessment> = await api.post(
      `/assessments/quick/${clientId}`,
      { notes }
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/assessments/${id}`);
  },
};

export default api;

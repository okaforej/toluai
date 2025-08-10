export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  job_title?: string;
  active: boolean;
  created_at: string;
  roles: string[];
  login_count: number;
  last_login_at?: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  industry?: string;
  sub_industry?: string;
  annual_revenue?: number;
  employee_count?: number;
  years_in_business?: number;
  business_structure?: string;
  client_type: string;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  revenue_category?: string;
  size_category?: string;
  risk_score?: number;
  risk_category?: string;
}

export interface RiskFactor {
  id: number;
  assessment_id: number;
  factor_name: string;
  factor_value: number;
  factor_weight: number;
  factor_category: string;
  description: string;
  source: string;
  severity?: string;
  impact_score: number;
  created_at: string;
}

export interface Recommendation {
  id: number;
  assessment_id: number;
  title: string;
  recommendation_text: string;
  category: string;
  priority: string;
  estimated_impact: number;
  implementation_cost: string;
  effort_level?: string;
  timeframe?: string;
  estimated_days?: number;
  status: string;
  assigned_to?: number;
  due_date?: string;
  completed_date?: string;
  resources_needed?: string;
  success_metrics?: string;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

export interface RiskAssessment {
  id: number;
  client_id: number;
  user_id: number;
  risk_score: number;
  risk_category: string;
  confidence: number;
  assessment_type: string;
  model_version: string;
  assessment_date: string;
  status: string;
  reviewed_by?: number;
  reviewed_at?: string;
  notes?: string;
  metadata: Record<string, any>;
  total_factors: number;
  high_priority_recommendations: number;
  factors?: RiskFactor[];
  recommendations?: Recommendation[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface PaginationMeta {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface ClientsResponse {
  clients: Client[];
  pagination: PaginationMeta;
}

export interface AssessmentsResponse {
  assessments: RiskAssessment[];
  pagination: PaginationMeta;
}

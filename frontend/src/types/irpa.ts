/**
 * TypeScript type definitions for IRPA (Insurance Risk Professional Assessment) system
 */

// Core IRPA Types
export interface IRPACompany {
  company_id: string;
  company_name: string;
  industry_type_id?: number;
  industry_type?: IndustryType;
  operating_margin?: number;
  company_size?: number;
  company_age?: number;
  pe_ratio?: number;
  state_id?: number;
  state?: State;
  registration_date: string;
  legal_structure?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

export interface IRPAUser {
  user_id: string;
  company_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  role_id: number;
  role?: IRPARole;
  agree_terms: boolean;
  created_at: string;
  last_login?: string;
  status: boolean;
  mfa_enabled: boolean;
  notification_settings?: any;
}

export interface InsuredEntity {
  insured_id: string;
  company_id: string;
  name: string;
  entity_type: string;
  // Professional data
  education_level_id?: number;
  education_level?: EducationLevel;
  years_experience?: number;
  job_title_id?: number;
  job_title?: JobTitle;
  job_tenure?: number;
  practice_field_id?: number;
  practice_field?: PracticeField;
  date_of_birth?: string;
  age?: number;
  // Financial data
  state_id?: number;
  state?: State;
  fico_score?: number;
  dti_ratio?: number;
  payment_history?: string;
  created_at: string;
  updated_at: string;
  data_completeness_score?: number;
  validation?: ValidationResults;
  // Related data
  company?: IRPACompany;
  latest_risk_score?: number;
  assigned_rep?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface IRPARiskAssessment {
  assessment_id: string;
  insured_id: string;
  user_id: string;
  status: 'new' | 'in_progress' | 'completed' | 'error';
  // Overall scores
  irpa_cci_score?: number;
  industry_risk_score?: number;
  professional_risk_score?: number;
  financial_risk_score?: number;
  risk_category: 'low' | 'medium' | 'high' | 'critical' | 'pending';
  // Industry component scores
  operating_margin_risk?: number;
  company_size_risk?: number;
  company_age_risk?: number;
  pe_ratio_risk?: number;
  // Professional component scores
  education_level_risk?: number;
  experience_risk?: number;
  job_title_score?: number;
  job_tenure_score?: number;
  practice_field_score?: number;
  age_score?: number;
  state_risk_score?: number;
  // Financial component scores
  fico_risk_score?: number;
  dti_risk_score?: number;
  payment_history_risk_score?: number;
  assessment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  insured_entity?: InsuredEntity;
  user?: IRPAUser;
  recommendations?: RiskRecommendation[];
}

// Reference Types
export interface IndustryType {
  industry_type_id: number;
  industry_name: string;
  risk_category: string;
  base_risk_factor: number;
  created_at: string;
}

export interface State {
  state_id: number;
  state_code: string;
  state_name: string;
  risk_factor: number;
  created_at: string;
}

export interface EducationLevel {
  education_level_id: number;
  level_name: string;
  risk_factor: number;
  created_at: string;
}

export interface JobTitle {
  job_title_id: number;
  title_name: string;
  risk_category: string;
  risk_factor: number;
  created_at: string;
}

export interface PracticeField {
  practice_field_id: number;
  field_name: string;
  risk_factor: number;
  created_at: string;
}

export interface IRPARole {
  role_id: number;
  role_name: string;
  description?: string;
  created_at: string;
}

// External Risk Types
export interface CybersecurityIncident {
  incident_id: string;
  company_id: string;
  incident_type_id: number;
  incident_type?: IncidentType;
  severity_level: number;
  incident_date: string;
  resolution_date?: string;
  is_resolved: boolean;
  days_to_resolution?: number;
  description?: string;
  affected_systems?: string;
  financial_impact?: number;
  reported_publicly: boolean;
  data_breach: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncidentType {
  incident_type_id: number;
  type_name: string;
  description?: string;
  base_risk_factor: number;
  created_at: string;
}

export interface RegulatoryCompliance {
  compliance_id: string;
  company_id: string;
  regulation_type_id: number;
  regulation_type?: RegulationType;
  audit_date: string;
  compliance_status: 'Compliant' | 'Non-Compliant' | 'Pending';
  is_compliant: boolean;
  severity_level?: number;
  findings?: string;
  remediation_plan?: string;
  remediation_deadline?: string;
  remediation_completed_date?: string;
  is_remediated: boolean;
  days_overdue: number;
  created_at: string;
  updated_at: string;
}

export interface RegulationType {
  regulation_type_id: number;
  regulation_name: string;
  description?: string;
  industry_specific: boolean;
  industry_type_id?: number;
  region_specific: boolean;
  region_id?: number;
  risk_factor: number;
  created_at: string;
}

// Utility Types
export interface ValidationResults {
  errors: string[];
  warnings: string[];
}

export interface RiskRecommendation {
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
  description: string;
  implementation_effort?: 'Low' | 'Medium' | 'High';
  estimated_impact?: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface AssessmentTrend {
  date: string;
  count: number;
  avg_score?: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CompaniesResponse extends PaginatedResponse<IRPACompany> {
  companies: IRPACompany[];
}

export interface InsuredEntitiesResponse extends PaginatedResponse<InsuredEntity> {
  insured_entities: InsuredEntity[];
}

export interface AssessmentsResponse extends PaginatedResponse<IRPARiskAssessment> {
  assessments: IRPARiskAssessment[];
}

export interface ReferenceDataResponse {
  industry_types?: IndustryType[];
  states?: State[];
  education_levels?: EducationLevel[];
  job_titles?: JobTitle[];
  practice_fields?: PracticeField[];
}

export interface AnalyticsResponse {
  risk_distribution?: RiskDistribution & { total_assessments: number };
  trends?: AssessmentTrend[];
}

// Form Types
export interface CreateCompanyForm {
  company_name: string;
  industry_type_id?: number;
  operating_margin?: number;
  company_size?: number;
  company_age?: number;
  pe_ratio?: number;
  state_id?: number;
  registration_date: string;
  legal_structure?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  zip_code?: string;
}

export interface CreateInsuredEntityForm {
  company_id: string;
  name: string;
  entity_type: string;
  education_level_id?: number;
  years_experience?: number;
  job_title_id?: number;
  job_tenure?: number;
  practice_field_id?: number;
  date_of_birth?: string;
  state_id?: number;
  fico_score?: number;
  dti_ratio?: number;
  payment_history?: string;
}

export interface RunAssessmentForm {
  insured_id: string;
  notes?: string;
}

// Audit Types
export interface UserActivityLog {
  log_id: string;
  user_id: string;
  activity_type: string;
  entity_type?: string;
  entity_id?: string;
  action_details?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  user?: IRPAUser;
}

export interface DataAccessLog {
  log_id: string;
  user_id: string;
  data_type: string;
  entity_id: string;
  access_type: string;
  timestamp: string;
  request_details?: any;
  ip_address?: string;
  user?: IRPAUser;
}

export interface ActivityLogsResponse extends PaginatedResponse<UserActivityLog> {
  activity_logs: UserActivityLog[];
}

export interface DataAccessLogsResponse extends PaginatedResponse<DataAccessLog> {
  data_access_logs: DataAccessLog[];
}

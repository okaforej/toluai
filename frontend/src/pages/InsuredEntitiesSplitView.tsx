import React, { useState, useEffect, Fragment } from 'react';
import {
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  XMarkIcon,
  CalculatorIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { irpaInsuredEntitiesAPI, irpaUtils, irpaReferenceAPI, irpaCompaniesAPI } from '../services/irpaApi';
import { InsuredEntity, IRPARiskAssessment } from '../types/irpa';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CompanyAutocomplete from '../components/CompanyAutocomplete';
import { EnrichedCompanyData } from '../services/companyEnrichment';
import { praCalculationService, PRAScoreResult } from '../services/praCalculation';
import { mockInsuredEntities } from '../data/mockInsuredEntities';
import { mockCompanies } from '../data/mockReferenceData';
import toast from 'react-hot-toast';

// Mock risk assessments data
const mockRiskAssessments: IRPARiskAssessment[] = [
  {
    assessment_id: 'ra-001',
    insured_id: 'mock-1',
    user_id: 'user-001',
    status: 'completed',
    irpa_cci_score: 82,
    industry_risk_score: 75,
    professional_risk_score: 85,
    financial_risk_score: 88,
    risk_category: 'low',
    assessment_date: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    notes: 'Excellent financial standing with strong professional credentials.',
  },
  {
    assessment_id: 'ra-002',
    insured_id: 'mock-2',
    user_id: 'user-002',
    status: 'in_progress',
    irpa_cci_score: 65,
    industry_risk_score: 60,
    professional_risk_score: 70,
    financial_risk_score: 62,
    risk_category: 'medium',
    assessment_date: '2024-01-14T14:20:00Z',
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-14T14:20:00Z',
    notes: 'Moderate risk profile. Recommend additional documentation for financial history.',
  },
  {
    assessment_id: 'ra-003',
    insured_id: 'mock-3',
    user_id: 'user-001',
    status: 'completed',
    irpa_cci_score: 45,
    industry_risk_score: 40,
    professional_risk_score: 48,
    financial_risk_score: 47,
    risk_category: 'high',
    assessment_date: '2024-01-13T09:15:00Z',
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:15:00Z',
    notes: 'High risk indicators in financial metrics. DTI ratio exceeds recommended thresholds.',
  },
  {
    assessment_id: 'ra-004',
    insured_id: 'mock-4',
    user_id: 'user-003',
    status: 'new',
    risk_category: 'pending',
    assessment_date: '2024-01-16T11:00:00Z',
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z',
    notes: 'Assessment pending. Awaiting additional documentation.',
  },
  {
    assessment_id: 'ra-005',
    insured_id: 'mock-5',
    user_id: 'user-002',
    status: 'error',
    risk_category: 'pending',
    assessment_date: '2024-01-12T16:45:00Z',
    created_at: '2024-01-12T16:45:00Z',
    updated_at: '2024-01-12T16:45:00Z',
    notes: 'Error in processing. Missing required financial data.',
  },
];

// Mock users data for assessor names
const mockUsers: Record<string, { name: string; role: string }> = {
  'user-001': { name: 'John Smith', role: 'Senior Underwriter' },
  'user-002': { name: 'Sarah Johnson', role: 'Risk Analyst' },
  'user-003': { name: 'Michael Chen', role: 'Underwriter' },
};

// Form interface for creating entity
interface EntityFormData {
  name: string;
  company_id: string;
  company_name: string;
  entity_type: string;
  fico_score: number | '';
  dti_ratio: number | '';
  years_experience: number | '';
  job_title: string;
  state: string;
  date_of_birth: string;
  // Company enriched data
  company_industry?: string;
  company_employees?: number;
  company_founded?: number;
  company_headquarters?: string;
  company_type?: string;
  company_website?: string;
  company_risk_factor?: number;
}

const InsuredEntitiesSplitView: React.FC = () => {
  const [entities, setEntities] = useState<InsuredEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<InsuredEntity | null>(null);
  const [riskAssessments, setRiskAssessments] = useState<IRPARiskAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [praScore, setPraScore] = useState<PRAScoreResult | null>(null);
  const [showPraScore, setShowPraScore] = useState(false);
  const [formData, setFormData] = useState<EntityFormData>({
    name: '',
    company_id: '',
    company_name: '',
    entity_type: 'Individual',
    fico_score: '',
    dti_ratio: '',
    years_experience: '',
    job_title: '',
    state: '',
    date_of_birth: '',
  });

  useEffect(() => {
    fetchEntities();
  }, [searchQuery, selectedCompany]);

  useEffect(() => {
    // Auto-select first entity when entities load
    if (entities.length > 0 && !selectedEntity) {
      handleEntitySelect(entities[0]);
    }
  }, [entities]);

  const fetchEntities = async () => {
    try {
      setLoading(true);

      // Try API first
      try {
        const response = await irpaInsuredEntitiesAPI.list({
          per_page: 100,
          search: searchQuery || undefined,
          company_id: selectedCompany !== 'all' ? selectedCompany : undefined,
        });

        if (response.insured_entities && response.insured_entities.length > 0) {
          // Ensure all entities have insured_id
          const validatedEntities = response.insured_entities.map((entity: InsuredEntity, index: number) => ({
            ...entity,
            insured_id: entity.insured_id || `api-${index + 1}`,
          }));
          setEntities(validatedEntities);
          return;
        }
      } catch (apiError) {
        console.log('API failed, using mock data:', apiError);
      }

      // Use mock data as fallback
      let filteredMockData = mockInsuredEntities;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredMockData = filteredMockData.filter(
          (entity) =>
            entity.name.toLowerCase().includes(query) ||
            entity.company?.company_name.toLowerCase().includes(query)
        );
      }

      if (selectedCompany !== 'all') {
        filteredMockData = filteredMockData.filter(
          (entity) => entity.company?.company_name === selectedCompany
        );
      }

      // Add mock FICO and DTI data if not present, and ensure insured_id exists
      const enrichedData = filteredMockData.map((entity, index) => ({
        ...entity,
        insured_id: entity.insured_id || `mock-${index + 1}`,
        fico_score: entity.fico_score || Math.floor(Math.random() * (850 - 600) + 600),
        dti_ratio: entity.dti_ratio || parseFloat((Math.random() * 0.6 + 0.1).toFixed(2)),
      }));

      console.log('Enriched entities:', enrichedData); // Debug log
      setEntities(enrichedData);
    } catch (err: any) {
      console.error('Failed to fetch entities:', err);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEntitySelect = (entity: InsuredEntity) => {
    setSelectedEntity(entity);
    if (entity.insured_id) {
      fetchRiskAssessments(entity.insured_id);
    } else {
      // If no insured_id, clear assessments
      setRiskAssessments([]);
    }
  };

  const fetchRiskAssessments = async (insuredId: string) => {
    // In a real app, this would be an API call
    // For now, we'll use mock data
    const assessments = mockRiskAssessments.filter(
      (assessment) => assessment.insured_id === insuredId
    );
    
    // If no assessments found, create a mock one
    if (assessments.length === 0) {
      const mockAssessment: IRPARiskAssessment = {
        assessment_id: `ra-${Date.now()}`,
        insured_id: insuredId,
        user_id: 'user-001',
        status: 'completed',
        irpa_cci_score: Math.floor(Math.random() * 40 + 60),
        industry_risk_score: Math.floor(Math.random() * 40 + 60),
        professional_risk_score: Math.floor(Math.random() * 40 + 60),
        financial_risk_score: Math.floor(Math.random() * 40 + 60),
        risk_category: Math.random() > 0.5 ? 'medium' : 'low',
        assessment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Auto-generated assessment for demonstration purposes.',
      };
      setRiskAssessments([mockAssessment]);
    } else {
      setRiskAssessments(assessments);
    }
  };

  const getStatusIcon = (status: IRPARiskAssessment['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: IRPARiskAssessment['status']) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      new: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getRiskCategoryBadge = (category: IRPARiskAssessment['risk_category']) => {
    const categoryStyles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[category]}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)} Risk
      </span>
    );
  };

  // Get unique companies for filter
  const uniqueCompanyNames = [
    ...new Set(entities.map((e) => e.company?.company_name).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle company selection from autocomplete
  const handleCompanySelect = (company: EnrichedCompanyData) => {
    setFormData(prev => ({
      ...prev,
      company_id: `company-${company.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      company_name: company.displayName || company.name,
      company_industry: company.industry,
      company_employees: company.employees,
      company_founded: company.founded,
      company_headquarters: company.headquarters ? 
        [company.headquarters.city, company.headquarters.state, company.headquarters.country]
          .filter(Boolean).join(', ') : undefined,
      company_type: company.type,
      company_website: company.website,
      company_risk_factor: company.riskFactor,
    }));
    
    // Show notification with company details
    toast.success(`Company data loaded for ${company.displayName || company.name}`);
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setPraScore(null);
    setShowPraScore(false);
    setFormData({
      name: '',
      company_id: '',
      company_name: '',
      entity_type: 'Individual',
      fico_score: '',
      dti_ratio: '',
      years_experience: '',
      job_title: '',
      state: '',
      date_of_birth: '',
    });
  };

  // Calculate PRA score based on form data
  const calculatePRAScore = () => {
    const scoreInputs = {
      fico_score: formData.fico_score ? Number(formData.fico_score) : undefined,
      dti_ratio: formData.dti_ratio ? Number(formData.dti_ratio) : undefined,
      years_experience: formData.years_experience ? Number(formData.years_experience) : undefined,
      entity_type: formData.entity_type,
      company_industry: formData.company_industry,
      company_risk_factor: formData.company_risk_factor,
      company_type: formData.company_type,
      company_employees: formData.company_employees,
      company_founded: formData.company_founded,
    };

    const result = praCalculationService.calculatePRAScore(scoreInputs);
    setPraScore(result);
    setShowPraScore(true);
    
    // Show notification based on risk category
    if (result.risk_category === 'low') {
      toast.success(`PRA Score: ${result.overall_score} - Low Risk`);
    } else if (result.risk_category === 'medium') {
      toast(`PRA Score: ${result.overall_score} - Medium Risk`, { icon: '⚠️' });
    } else {
      toast.error(`PRA Score: ${result.overall_score} - ${result.risk_category === 'high' ? 'High' : 'Critical'} Risk`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.company_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Generate company_id if not set
    if (!formData.company_id) {
      formData.company_id = `company-${formData.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }

    // Auto-run assessment before adding entity
    if (!showPraScore || !praScore) {
      calculatePRAScore();
      toast('Running risk assessment before adding entity...', { icon: '⏳' });
      // Wait briefly for user to see the assessment
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setFormLoading(true);
    
    try {
      // Create new entity with enriched company data
      const newEntity: InsuredEntity = {
        insured_id: `insured-${Date.now()}`,
        company_id: formData.company_id,
        name: formData.name,
        entity_type: formData.entity_type,
        fico_score: formData.fico_score ? Number(formData.fico_score) : undefined,
        dti_ratio: formData.dti_ratio ? Number(formData.dti_ratio) : undefined,
        years_experience: formData.years_experience ? Number(formData.years_experience) : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add company reference
        company: {
          company_id: formData.company_id,
          company_name: formData.company_name,
          industry: formData.company_industry,
          employees_count: formData.company_employees,
          founded_year: formData.company_founded,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      // Try API first
      try {
        await irpaInsuredEntitiesAPI.create(newEntity);
      } catch (apiError) {
        console.log('API failed, adding to local state:', apiError);
      }

      // Add to local state
      setEntities(prev => [newEntity, ...prev]);
      
      // Close modal and reset form
      handleCloseModal();
      
      toast.success('Entity added successfully!');
      
      // Select the new entity
      handleEntitySelect(newEntity);
    } catch (error) {
      console.error('Failed to add entity:', error);
      toast.error('Failed to add entity');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insured Entities</h1>
            <p className="text-sm text-gray-600 mt-1">
              View and manage insured entities with risk assessments
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Entity
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Companies</option>
            {uniqueCompanyNames.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Split View Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Entities Table */}
        <div className="w-1/2 bg-white border-r border-gray-200 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FICO Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DTI Ratio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No entities found
                  </td>
                </tr>
              ) : (
                entities.map((entity, index) => (
                  <tr
                    key={entity.insured_id || `entity-${index}`}
                    onClick={() => handleEntitySelect(entity)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedEntity?.insured_id === entity.insured_id
                        ? 'bg-primary-50 hover:bg-primary-100'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entity.insured_id ? entity.insured_id.slice(-8).toUpperCase() : `ID-${index}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{entity.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">
                        {entity.company?.company_name || 'No Company'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {entity.fico_score || 'N/A'}
                        </span>
                        {entity.fico_score && (
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                entity.fico_score >= 740
                                  ? 'bg-green-500'
                                  : entity.fico_score >= 670
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{
                                width: `${((entity.fico_score - 300) / 550) * 100}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {entity.dti_ratio ? `${(entity.dti_ratio * 100).toFixed(2)}%` : 'N/A'}
                        </span>
                        {entity.dti_ratio && (
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                entity.dti_ratio <= 0.36
                                  ? 'bg-green-500'
                                  : entity.dti_ratio <= 0.50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min(entity.dti_ratio * 100, 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Panel - Risk Assessment Details */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          {selectedEntity ? (
            <div className="p-6">
              {/* Entity Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedEntity.name || 'Unknown Entity'}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {selectedEntity.insured_id ? selectedEntity.insured_id.slice(-8).toUpperCase() : 'N/A'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Company</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedEntity.company?.company_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Entity Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedEntity.entity_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">FICO Score</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedEntity.fico_score || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">DTI Ratio</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedEntity.dti_ratio
                            ? `${(selectedEntity.dti_ratio * 100).toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-10 h-10 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Risk Assessments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessments</h3>
                
                {riskAssessments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No risk assessments found</p>
                    <button
                      onClick={() => toast('Create Assessment feature coming soon!', { icon: 'ℹ️' })}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      Create Assessment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {riskAssessments.map((assessment) => (
                      <div
                        key={assessment.assessment_id}
                        className="bg-white rounded-lg shadow-sm p-6"
                      >
                        {/* Assessment Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(assessment.status)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Assessment #{assessment.assessment_id.slice(-6).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(assessment.assessment_date).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(assessment.status)}
                            {assessment.risk_category && getRiskCategoryBadge(assessment.risk_category)}
                          </div>
                        </div>

                        {/* Assessor Information */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Assessed by</p>
                          <p className="text-sm font-medium text-gray-900">
                            {mockUsers[assessment.user_id]?.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {mockUsers[assessment.user_id]?.role || 'N/A'}
                          </p>
                        </div>

                        {/* Risk Scores */}
                        {assessment.status === 'completed' && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-900 mb-3">Risk Scores</p>
                            <div className="space-y-2">
                              {assessment.irpa_cci_score && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Overall CCI Score</span>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">
                                      {assessment.irpa_cci_score}
                                    </span>
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          assessment.irpa_cci_score >= 80
                                            ? 'bg-green-500'
                                            : assessment.irpa_cci_score >= 60
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        }`}
                                        style={{ width: `${assessment.irpa_cci_score}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {assessment.industry_risk_score && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Industry Risk</span>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">
                                      {assessment.industry_risk_score}
                                    </span>
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          assessment.industry_risk_score >= 80
                                            ? 'bg-green-500'
                                            : assessment.industry_risk_score >= 60
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        }`}
                                        style={{ width: `${assessment.industry_risk_score}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {assessment.professional_risk_score && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Professional Risk</span>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">
                                      {assessment.professional_risk_score}
                                    </span>
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          assessment.professional_risk_score >= 80
                                            ? 'bg-green-500'
                                            : assessment.professional_risk_score >= 60
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        }`}
                                        style={{ width: `${assessment.professional_risk_score}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {assessment.financial_risk_score && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Financial Risk</span>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">
                                      {assessment.financial_risk_score}
                                    </span>
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          assessment.financial_risk_score >= 80
                                            ? 'bg-green-500'
                                            : assessment.financial_risk_score >= 60
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        }`}
                                        style={{ width: `${assessment.financial_risk_score}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {assessment.notes && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-medium text-blue-900 mb-1">Notes</p>
                            <p className="text-sm text-blue-800">{assessment.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex items-center justify-end space-x-2">
                          <button
                            onClick={() => toast('View Details feature coming soon!', { icon: 'ℹ️' })}
                            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View Details
                          </button>
                          {assessment.status === 'completed' && (
                            <button
                              onClick={() => toast('Download Report feature coming soon!', { icon: 'ℹ️' })}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 font-medium"
                            >
                              Download Report
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Actions */}
                <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-900 mb-3">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toast('New Assessment feature coming soon!', { icon: 'ℹ️' })}
                      className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      New Assessment
                    </button>
                    <button
                      onClick={() => toast('View History feature coming soon!', { icon: 'ℹ️' })}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View History
                    </button>
                    <button
                      onClick={() => toast('Edit Entity feature coming soon!', { icon: 'ℹ️' })}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Edit Entity
                    </button>
                    <button
                      onClick={() => toast('Export Data feature coming soon!', { icon: 'ℹ️' })}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Export Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select an entity to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Entity Modal */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center justify-between"
                  >
                    Add New Insured Entity
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="John Doe"
                        />
                      </div>

                      {/* Company */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company *
                        </label>
                        <CompanyAutocomplete
                          value={formData.company_name}
                          onChange={(value) => setFormData(prev => ({ ...prev, company_name: value }))}
                          onCompanySelect={handleCompanySelect}
                          placeholder="Start typing company name..."
                          required
                        />
                      </div>

                      {/* Entity Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Entity Type
                        </label>
                        <select
                          name="entity_type"
                          value={formData.entity_type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="Individual">Individual</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>

                      {/* Company Industry (Auto-populated) */}
                      {formData.company_industry && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Industry
                          </label>
                          <input
                            type="text"
                            value={formData.company_industry}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                          />
                        </div>
                      )}

                      {/* FICO Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          FICO Score
                        </label>
                        <input
                          type="number"
                          name="fico_score"
                          value={formData.fico_score}
                          onChange={handleInputChange}
                          min="300"
                          max="850"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="750"
                        />
                      </div>

                      {/* DTI Ratio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DTI Ratio (%)
                        </label>
                        <input
                          type="number"
                          name="dti_ratio"
                          value={formData.dti_ratio ? formData.dti_ratio * 100 : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              dti_ratio: value ? Number(value) / 100 : ''
                            }));
                          }}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="25"
                        />
                      </div>

                      {/* Years of Experience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="years_experience"
                          value={formData.years_experience}
                          onChange={handleInputChange}
                          min="0"
                          max="50"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="5"
                        />
                      </div>

                      {/* Job Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Senior Analyst"
                        />
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="California"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    {/* PRA Score Calculation Section */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center">
                          <ShieldCheckIcon className="w-5 h-5 mr-2 text-blue-600" />
                          Professional Risk Assessment (PRA)
                        </h4>
                        <button
                          type="button"
                          onClick={calculatePRAScore}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                        >
                          <CalculatorIcon className="w-4 h-4 mr-1" />
                          Calculate Score
                        </button>
                      </div>
                      
                      {showPraScore && praScore && (
                        <div className="space-y-3">
                          {/* Dual Score Display - IPRA and PRA */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* IPRA Score */}
                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                              <div className="text-xs font-medium text-gray-600 mb-1">IPRA Score</div>
                              <div className="text-xs text-gray-500 mb-2">Individual Professional Risk</div>
                              <div className={`text-2xl font-bold ${
                                praScore.ipra_score >= 75 ? 'text-green-600' :
                                praScore.ipra_score >= 50 ? 'text-yellow-600' :
                                praScore.ipra_score >= 25 ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {praScore.ipra_score}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Financial (50%) + Professional (50%)
                              </div>
                            </div>
                            
                            {/* Aggregate PRA Score */}
                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                              <div className="text-xs font-medium text-gray-600 mb-1">PRA Score</div>
                              <div className="text-xs text-gray-500 mb-2">Aggregate Weighted Risk</div>
                              <div className={`text-2xl font-bold ${
                                praScore.risk_category === 'low' ? 'text-green-600' :
                                praScore.risk_category === 'medium' ? 'text-yellow-600' :
                                praScore.risk_category === 'high' ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {praScore.overall_score}
                              </div>
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                praScore.risk_category === 'low' ? 'bg-green-100 text-green-800' :
                                praScore.risk_category === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                praScore.risk_category === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {praScore.risk_category.toUpperCase()} RISK
                              </span>
                            </div>
                          </div>
                          
                          {/* Component Scores with Weights */}
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div className="bg-white p-2 rounded border border-gray-200">
                              <div className="text-xs text-gray-500">Financial</div>
                              <div className="font-medium">{praScore.financial_risk_score}</div>
                              <div className="text-xs text-gray-400">{(praScore.weighted_components?.financial_weight * 100).toFixed(0)}%</div>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-200">
                              <div className="text-xs text-gray-500">Professional</div>
                              <div className="font-medium">{praScore.professional_risk_score}</div>
                              <div className="text-xs text-gray-400">{(praScore.weighted_components?.professional_weight * 100).toFixed(0)}%</div>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-200">
                              <div className="text-xs text-gray-500">Industry</div>
                              <div className="font-medium">{praScore.industry_risk_score}</div>
                              <div className="text-xs text-gray-400">{(praScore.weighted_components?.industry_weight * 100).toFixed(0)}%</div>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-200">
                              <div className="text-xs text-gray-500">Company</div>
                              <div className="font-medium">{praScore.company_risk_score}</div>
                              <div className="text-xs text-gray-400">{(praScore.weighted_components?.company_weight * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                          
                          {/* Confidence Level */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Data Confidence</span>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{ width: `${praScore.confidence_level}%` }}
                                />
                              </div>
                              <span className="text-gray-700 font-medium">{praScore.confidence_level}%</span>
                            </div>
                          </div>
                          
                          {/* Factors Analysis */}
                          {praScore.factors && (
                            <div className="mt-3 space-y-2">
                              {/* Positive Factors */}
                              {praScore.factors.positive.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-green-700 mb-1">Positive Factors</div>
                                  <div className="space-y-1">
                                    {praScore.factors.positive.map((factor, idx) => (
                                      <div key={idx} className="text-xs text-gray-600 flex items-start">
                                        <CheckCircleIcon className="w-3 h-3 mt-0.5 mr-1 text-green-500 flex-shrink-0" />
                                        {factor}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Negative Factors */}
                              {praScore.factors.negative.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-red-700 mb-1">Risk Factors</div>
                                  <div className="space-y-1">
                                    {praScore.factors.negative.map((factor, idx) => (
                                      <div key={idx} className="text-xs text-gray-600 flex items-start">
                                        <ExclamationCircleIcon className="w-3 h-3 mt-0.5 mr-1 text-red-500 flex-shrink-0" />
                                        {factor}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Recommendations */}
                              {praScore.factors.recommendations.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-blue-700 mb-1">Recommendations</div>
                                  <div className="space-y-1">
                                    {praScore.factors.recommendations.map((rec, idx) => (
                                      <div key={idx} className="text-xs text-gray-600 flex items-start">
                                        <span className="mr-1">•</span>
                                        {rec}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!showPraScore && (
                        <p className="text-sm text-gray-600">
                          Click "Calculate Score" to run a risk assessment based on the entered data.
                        </p>
                      )}
                    </div>

                    {/* Company Risk Score - Shows immediately when company is selected */}
                    {formData.company_risk_factor !== undefined && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 flex items-center">
                              <ShieldCheckIcon className="w-5 h-5 mr-2 text-yellow-600" />
                              Company Risk Score
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">{formData.company_name}</p>
                          </div>
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${
                              formData.company_risk_factor <= 0.8 ? 'text-green-600' :
                              formData.company_risk_factor <= 1.2 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {Math.round((1 - Math.min(formData.company_risk_factor, 2) / 2) * 100)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Risk Factor: {formData.company_risk_factor.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Company Information (Auto-populated) */}
                    {formData.company_industry && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Company Information</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {formData.company_type && (
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-2 text-gray-900 font-medium capitalize">{formData.company_type}</span>
                            </div>
                          )}
                          {formData.company_employees && (
                            <div>
                              <span className="text-gray-500">Employees:</span>
                              <span className="ml-2 text-gray-900 font-medium">{formData.company_employees.toLocaleString()}</span>
                            </div>
                          )}
                          {formData.company_founded && (
                            <div>
                              <span className="text-gray-500">Founded:</span>
                              <span className="ml-2 text-gray-900 font-medium">{formData.company_founded}</span>
                            </div>
                          )}
                          {formData.company_headquarters && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Headquarters:</span>
                              <span className="ml-2 text-gray-900 font-medium">{formData.company_headquarters}</span>
                            </div>
                          )}
                          {formData.company_website && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Website:</span>
                              <a href={formData.company_website} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-600 hover:text-primary-700">
                                {formData.company_website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="mt-6 flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {formLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Adding...</span>
                          </>
                        ) : (
                          <span>Add Entity</span>
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default InsuredEntitiesSplitView;
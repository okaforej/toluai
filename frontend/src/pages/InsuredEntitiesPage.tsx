import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDate, getRiskBadgeColor, formatCurrency } from '../utils/risk';
import { irpaInsuredEntitiesAPI, irpaUtils, irpaReferenceAPI, irpaCompaniesAPI } from '../services/irpaApi';
import { InsuredEntity, CreateInsuredEntityForm } from '../types/irpa';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { mockInsuredEntities } from '../data/mockInsuredEntities';
import { 
  mockIndustryTypes, 
  mockStates, 
  mockEducationLevels, 
  mockJobTitles, 
  mockPracticeFields, 
  mockCompanies 
} from '../data/mockReferenceData';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

const InsuredEntitiesPage: React.FC = () => {
  const [entities, setEntities] = useState<InsuredEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<InsuredEntity | null>(null);
  
  // Reference data
  const [companies, setCompanies] = useState<any[]>([]);
  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [practiceFields, setPracticeFields] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEntities();
    }, searchQuery ? 300 : 0); // 300ms delay for search, immediate for other filters
    
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchQuery, selectedCompany, selectedEntityType, selectedRiskLevel]);
  
  // Fetch reference data on mount
  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      // Try to fetch real data first
      const [companiesData, referenceData] = await Promise.all([
        irpaCompaniesAPI.list({ per_page: 100 }),
        irpaReferenceAPI.getAllReferenceData(),
      ]);
      
      setCompanies(companiesData.companies || []);
      setEducationLevels(referenceData.education_levels);
      setJobTitles(referenceData.job_titles);
      setPracticeFields(referenceData.practice_fields);
      setStates(referenceData.states);
    } catch (error) {
      console.warn('API not available, using mock reference data:', error);
      // Fall back to mock data
      setCompanies(mockCompanies);
      setEducationLevels(mockEducationLevels);
      setJobTitles(mockJobTitles);
      setPracticeFields(mockPracticeFields);
      setStates(mockStates);
      
      // Show info toast only once
      if (!sessionStorage.getItem('mock-data-notice-shown')) {
        toast.info('Using demo data - API server not available', { duration: 3000 });
        sessionStorage.setItem('mock-data-notice-shown', 'true');
      }
    }
  };

  const fetchEntities = async () => {
    try {
      setLoading(true);

      try {
        const response = await irpaInsuredEntitiesAPI.list({
          page: currentPage,
          per_page: 20,
          search: searchQuery || undefined,
          company_id: selectedCompany !== 'all' ? selectedCompany : undefined,
        });

        if (response.insured_entities && response.insured_entities.length > 0) {
          setEntities(response.insured_entities);
          setTotalPages(response.pagination?.pages || 1);
          setError(null);
          return;
        }
      } catch (apiError) {
        console.log('API failed, using mock data:', apiError);
      }

      // Use mock data as fallback
      console.log('Using mock insured entities data');
      const itemsPerPage = 20;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      // Filter mock data based on search and company selection
      let filteredMockData = mockInsuredEntities;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredMockData = filteredMockData.filter(
          (entity) =>
            entity.name.toLowerCase().includes(query) ||
            entity.job_title?.title_name.toLowerCase().includes(query) ||
            entity.practice_field?.field_name.toLowerCase().includes(query) ||
            entity.company?.company_name.toLowerCase().includes(query) ||
            entity.education_level?.level_name.toLowerCase().includes(query) ||
            entity.state?.state_name.toLowerCase().includes(query)
        );
      }

      if (selectedCompany !== 'all') {
        filteredMockData = filteredMockData.filter(
          (entity) => entity.company?.company_name === selectedCompany
        );
      }
      
      if (selectedEntityType !== 'all') {
        filteredMockData = filteredMockData.filter(
          (entity) => entity.entity_type === selectedEntityType
        );
      }

      const paginatedData = filteredMockData.slice(startIndex, endIndex);

      // Add latest_risk_score based on FICO score and other factors
      const entitiesWithRiskScore = paginatedData.map((entity) => ({
        ...entity,
        latest_risk_score: calculateMockRiskScore(entity),
      }));

      setEntities(entitiesWithRiskScore);
      setTotalPages(Math.ceil(filteredMockData.length / itemsPerPage));
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to fetch insured entities');
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate a mock risk score based on various factors
  const calculateMockRiskScore = (entity: InsuredEntity): number => {
    let baseScore = 75; // Start with medium risk

    // FICO score impact (30% weight)
    if (entity.fico_score) {
      if (entity.fico_score >= 800) baseScore += 10;
      else if (entity.fico_score >= 740) baseScore += 5;
      else if (entity.fico_score >= 670) baseScore += 0;
      else if (entity.fico_score >= 580) baseScore -= 10;
      else baseScore -= 20;
    }

    // Experience impact (20% weight)
    if (entity.years_experience) {
      if (entity.years_experience >= 10) baseScore += 8;
      else if (entity.years_experience >= 5) baseScore += 4;
      else if (entity.years_experience < 2) baseScore -= 5;
    }

    // Education impact (15% weight)
    if (entity.education_level) {
      baseScore += Math.round((2 - entity.education_level.risk_factor) * 5);
    }

    // State risk impact (10% weight)
    if (entity.state) {
      baseScore += Math.round((1 - entity.state.risk_factor) * 3);
    }

    // DTI ratio impact (10% weight)
    if (entity.dti_ratio) {
      if (entity.dti_ratio < 0.3) baseScore += 3;
      else if (entity.dti_ratio > 0.6) baseScore -= 5;
    }

    // Job title risk impact (10% weight)
    if (entity.job_title) {
      baseScore += Math.round((1 - entity.job_title.risk_factor) * 5);
    }

    // Age impact (5% weight)
    if (entity.age) {
      if (entity.age >= 30 && entity.age <= 50) baseScore += 2;
      else if (entity.age < 25 || entity.age > 60) baseScore -= 2;
    }

    // Ensure score is within reasonable bounds
    return Math.max(20, Math.min(95, baseScore + Math.random() * 10 - 5));
  };

  // Get unique companies for filter
  const allEntitiesForFilter = entities.length > 0 ? entities : mockInsuredEntities;
  const uniqueCompanyNames = [
    ...new Set(allEntitiesForFilter.map((e) => e.company?.company_name).filter(Boolean)),
  ];

  const getRiskLevel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'High';
    return 'Critical';
  };
  
  const getRiskLevelDisplay = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 80) return 'Low Risk';
    if (score >= 60) return 'Moderate Risk';
    if (score >= 40) return 'High Risk';
    return 'Critical Risk';
  };

  const filteredEntities = entities.filter((entity) => {
    const riskLevel = getRiskLevel(entity.latest_risk_score);
    const matchesRiskLevel = selectedRiskLevel === 'all' || getRiskLevelDisplay(entity.latest_risk_score) === selectedRiskLevel;
    return matchesRiskLevel;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Insured Entities</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and assess insured professionals and entities
          </p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Entity
        </button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Entities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{entities.length}</p>
            </div>
            <UserIcon className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Individual Entities</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {entities.filter((e) => e.entity_type === 'Individual').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-success-500 rounded-full" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Corporate Entities</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {entities.filter((e) => e.entity_type === 'Corporate').length}
              </p>
            </div>
            <BriefcaseIcon className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Risk Score</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">
                {entities.length > 0
                  ? Math.round(
                      entities.reduce((acc, e) => acc + (e.latest_risk_score || 0), 0) /
                        entities.length
                    )
                  : 0}
              </p>
            </div>
            <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-warning-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search entities by name, job title, practice field, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
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
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Moderate Risk">Moderate Risk</option>
              <option value="High Risk">High Risk</option>
              <option value="Critical Risk">Critical Risk</option>
            </select>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Entity Types</option>
              <option value="Individual">Individual</option>
              <option value="Corporate">Corporate</option>
            </select>
            <button 
              onClick={() => toast.info('Advanced filters coming soon!')}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              More Filters
            </button>
            <button 
              onClick={handleExportEntities}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Entities Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FICO / DTI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reg. Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Rep
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No insured entities found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntities.map((entity, index) => {
                  const riskLevel = getRiskLevel(entity.latest_risk_score);
                  const riskLevelDisplay = getRiskLevelDisplay(entity.latest_risk_score);
                  const riskColor = irpaUtils.getRiskCategoryColor(riskLevel);

                  return (
                    <tr key={entity.insured_id || `entity-${index}`} className="hover:bg-gray-50">
                      {/* Entity Name & ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                          <div className="text-xs text-gray-500">
                            ID: {entity.insured_id?.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </td>
                      
                      {/* FICO Score & DTI Ratio */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            FICO: <span className="font-medium">{entity.fico_score || 'N/A'}</span>
                          </div>
                          <div className="text-gray-500">
                            DTI: <span className="font-medium">
                              {entity.dti_ratio ? `${(entity.dti_ratio * 100).toFixed(2)}%` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Contract Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entity.entity_type}
                        </div>
                      </td>
                      
                      {/* Company & Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">
                            {entity.company?.company_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entity.company?.company_type || entity.company?.industry || 'N/A'}
                          </div>
                        </div>
                      </td>
                      
                      {/* Job Title */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entity.job_title?.title_name || 'N/A'}
                        </div>
                      </td>
                      
                      {/* Risk Score */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-center">
                          <div className="text-sm font-bold text-gray-900">
                            {entity.latest_risk_score?.toFixed(0) || 'N/A'}
                          </div>
                          <div
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${riskColor}`}
                          >
                            {riskLevelDisplay}
                          </div>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      
                      {/* Registration Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {entity.created_at ? new Date(entity.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : 'N/A'}
                        </div>
                      </td>
                      
                      {/* Assigned Rep */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entity.assigned_rep || 'Unassigned'}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2 justify-center">
                          <button
                            className="text-primary-600 hover:text-primary-800 transition-colors"
                            onClick={() => handleViewEntity(entity)}
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                            onClick={() => handleEditEntity(entity)}
                            title="Edit Entity"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 transition-colors"
                            onClick={() => handleDeleteEntity(entity)}
                            title="Delete Entity"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg border border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + Math.max(1, currentPage - 2);
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Entity Modal */}
      <EntityModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingEntity(null);
        }}
        onSubmit={isEditModalOpen ? handleUpdateEntity : handleCreateEntity}
        entity={editingEntity}
        companies={companies}
        educationLevels={educationLevels}
        jobTitles={jobTitles}
        practiceFields={practiceFields}
        states={states}
        isEdit={isEditModalOpen}
      />
    </div>
  );
  
  // Event handlers
  function handleViewEntity(entity: InsuredEntity) {
    toast.success(`Viewing details for ${entity.name}`);
    // TODO: Navigate to entity details page or open details modal
    console.log('View entity:', entity);
  }
  
  function handleEditEntity(entity: InsuredEntity) {
    setEditingEntity(entity);
    setIsEditModalOpen(true);
  }
  
  async function handleDeleteEntity(entity: InsuredEntity) {
    if (!confirm(`Are you sure you want to delete ${entity.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await irpaInsuredEntitiesAPI.delete(entity.insured_id);
      toast.success(`${entity.name} has been deleted successfully`);
      fetchEntities(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete entity');
      console.error('Delete error:', error);
    }
  }
  
  async function handleCreateEntity(formData: CreateInsuredEntityForm) {
    try {
      await irpaInsuredEntitiesAPI.create(formData);
      toast.success('Insured entity created successfully');
      setIsAddModalOpen(false);
      fetchEntities();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create entity');
      throw error; // Re-throw to prevent modal from closing
    }
  }
  
  async function handleUpdateEntity(formData: CreateInsuredEntityForm) {
    if (!editingEntity) return;
    
    try {
      await irpaInsuredEntitiesAPI.update(editingEntity.insured_id, formData);
      toast.success('Insured entity updated successfully');
      setIsEditModalOpen(false);
      setEditingEntity(null);
      fetchEntities();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update entity');
      throw error; // Re-throw to prevent modal from closing
    }
  }
  
  function handleExportEntities() {
    try {
      // Create CSV content
      const headers = [
        'Name',
        'Entity ID',
        'FICO Score',
        'DTI Ratio',
        'Contract Type',
        'Company',
        'Company Type',
        'Job Title',
        'Risk Score',
        'Status',
        'Registration Date',
        'Assigned Rep',
        'Practice Field',
        'Years Experience',
        'Education Level',
        'State'
      ];
      
      const csvContent = [
        headers.join(','),
        ...filteredEntities.map(entity => [
          `"${entity.name}"`,
          `"${entity.insured_id?.slice(-8).toUpperCase() || 'N/A'}"`,
          entity.fico_score || 'N/A',
          entity.dti_ratio ? `${(entity.dti_ratio * 100).toFixed(2)}%` : 'N/A',
          `"${entity.entity_type}"`,
          `"${entity.company?.company_name || 'N/A'}"`,
          `"${entity.company?.company_type || entity.company?.industry || 'N/A'}"`,
          `"${entity.job_title?.title_name || 'N/A'}"`,
          entity.latest_risk_score?.toFixed(0) || 'N/A',
          `"${entity.status || 'Active'}"`,
          `"${entity.created_at ? new Date(entity.created_at).toLocaleDateString('en-US') : 'N/A'}"`,
          `"${entity.assigned_rep || 'Unassigned'}"`,
          `"${entity.practice_field?.field_name || 'N/A'}"`,
          entity.years_experience || 'N/A',
          `"${entity.education_level?.level_name || 'N/A'}"`,
          `"${entity.state?.state_name || 'N/A'}"`
        ].join(','))
      ].join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `insured-entities-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Entities exported successfully');
    } catch (error) {
      toast.error('Failed to export entities');
      console.error('Export error:', error);
    }
  }
};

// Entity Modal Component
interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInsuredEntityForm) => Promise<void>;
  entity: InsuredEntity | null;
  companies: any[];
  educationLevels: any[];
  jobTitles: any[];
  practiceFields: any[];
  states: any[];
  isEdit: boolean;
}

const EntityModal: React.FC<EntityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  entity,
  companies,
  educationLevels,
  jobTitles,
  practiceFields,
  states,
  isEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateInsuredEntityForm>({
    company_id: '',
    name: '',
    entity_type: 'Individual',
    education_level_id: undefined,
    years_experience: undefined,
    job_title_id: undefined,
    job_tenure: undefined,
    practice_field_id: undefined,
    date_of_birth: '',
    state_id: undefined,
    fico_score: undefined,
    dti_ratio: undefined,
    payment_history: '',
  });
  
  useEffect(() => {
    if (entity && isEdit) {
      setFormData({
        company_id: entity.company_id,
        name: entity.name,
        entity_type: entity.entity_type,
        education_level_id: entity.education_level_id,
        years_experience: entity.years_experience,
        job_title_id: entity.job_title_id,
        job_tenure: entity.job_tenure,
        practice_field_id: entity.practice_field_id,
        date_of_birth: entity.date_of_birth || '',
        state_id: entity.state_id,
        fico_score: entity.fico_score,
        dti_ratio: entity.dti_ratio,
        payment_history: entity.payment_history || '',
      });
    } else {
      // Reset form for new entity
      setFormData({
        company_id: '',
        name: '',
        entity_type: 'Individual',
        education_level_id: undefined,
        years_experience: undefined,
        job_title_id: undefined,
        job_tenure: undefined,
        practice_field_id: undefined,
        date_of_birth: '',
        state_id: undefined,
        fico_score: undefined,
        dti_ratio: undefined,
        payment_history: '',
      });
    }
  }, [entity, isEdit, isOpen]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Clean up form data
      const cleanedData = {
        ...formData,
        education_level_id: formData.education_level_id || undefined,
        years_experience: formData.years_experience || undefined,
        job_title_id: formData.job_title_id || undefined,
        job_tenure: formData.job_tenure || undefined,
        practice_field_id: formData.practice_field_id || undefined,
        state_id: formData.state_id || undefined,
        fico_score: formData.fico_score || undefined,
        dti_ratio: formData.dti_ratio || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        payment_history: formData.payment_history || undefined,
      };
      
      await onSubmit(cleanedData);
    } catch (error) {
      // Error is handled in parent component
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : 
        ['education_level_id', 'years_experience', 'job_title_id', 'job_tenure', 'practice_field_id', 'state_id', 'fico_score'].includes(name) ? parseInt(value) :
        name === 'dti_ratio' ? parseFloat(value) : value
    }));
  };
  
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={React.Fragment}
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {isEdit ? 'Edit Insured Entity' : 'Add New Insured Entity'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                        <select
                          name="company_id"
                          value={formData.company_id}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select a company</option>
                          {companies.map(company => (
                            <option key={company.company_id} value={company.company_id}>
                              {company.company_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
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
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
                        <select
                          name="entity_type"
                          value={formData.entity_type}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="Individual">Individual</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                        <select
                          name="education_level_id"
                          value={formData.education_level_id || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select education level</option>
                          {educationLevels.map(level => (
                            <option key={level.education_level_id} value={level.education_level_id}>
                              {level.level_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                        <input
                          type="number"
                          name="years_experience"
                          value={formData.years_experience || ''}
                          onChange={handleInputChange}
                          min="0"
                          max="50"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="5"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                        <select
                          name="job_title_id"
                          value={formData.job_title_id || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select job title</option>
                          {jobTitles.map(title => (
                            <option key={title.job_title_id} value={title.job_title_id}>
                              {title.title_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Tenure (months)</label>
                        <input
                          type="number"
                          name="job_tenure"
                          value={formData.job_tenure || ''}
                          onChange={handleInputChange}
                          min="0"
                          max="600"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="24"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Practice Field</label>
                        <select
                          name="practice_field_id"
                          value={formData.practice_field_id || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select practice field</option>
                          {practiceFields.map(field => (
                            <option key={field.practice_field_id} value={field.practice_field_id}>
                              {field.field_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Financial Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <select
                          name="state_id"
                          value={formData.state_id || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select state</option>
                          {states.map(state => (
                            <option key={state.state_id} value={state.state_id}>
                              {state.state_name} ({state.state_code})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">FICO Score</label>
                        <input
                          type="number"
                          name="fico_score"
                          value={formData.fico_score || ''}
                          onChange={handleInputChange}
                          min="300"
                          max="850"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="750"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Debt-to-Income Ratio</label>
                        <input
                          type="number"
                          name="dti_ratio"
                          value={formData.dti_ratio || ''}
                          onChange={handleInputChange}
                          min="0"
                          max="1"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="0.25"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment History</label>
                        <select
                          name="payment_history"
                          value={formData.payment_history || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select payment history</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.name || !formData.company_id}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>{isEdit ? 'Update' : 'Create'} Entity</span>
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InsuredEntitiesPage;

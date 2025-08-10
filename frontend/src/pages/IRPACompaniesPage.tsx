import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { irpaCompaniesAPI, irpaReferenceAPI, irpaUtils } from '../services/irpaApi';
import { IRPACompany, IndustryType, State } from '../types/irpa';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CreateCompanyModal from '../components/IRPA/CreateCompanyModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const IRPACompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<IRPACompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [industryTypes, setIndustryTypes] = useState<IndustryType[]>([]);
  const [states, setStates] = useState<State[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const perPage = 10;

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [searchTerm, industryFilter, stateFilter, currentPage]);

  const loadReferenceData = async () => {
    try {
      const [industryTypesResponse, statesResponse] = await Promise.all([
        irpaReferenceAPI.getIndustryTypes(),
        irpaReferenceAPI.getStates(),
      ]);

      setIndustryTypes(industryTypesResponse.industry_types || []);
      setStates(statesResponse.states || []);
    } catch (error) {
      console.error('Error loading reference data:', error);
      toast.error('Failed to load reference data');
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await irpaCompaniesAPI.list({
        page: currentPage,
        per_page: perPage,
        search: searchTerm || undefined,
        industry_type_id: industryFilter ? parseInt(industryFilter) : undefined,
        state_id: stateFilter ? parseInt(stateFilter) : undefined,
      });

      setCompanies(response.companies);
      setTotalPages(response.pagination.pages);
      setTotalCompanies(response.pagination.total);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (companyData: any) => {
    try {
      await irpaCompaniesAPI.create(companyData);
      toast.success('Company created successfully');
      setIsCreateModalOpen(false);
      loadCompanies();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create company';
      toast.error(message);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleIndustryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIndustryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStateFilter(e.target.value);
    setCurrentPage(1);
  };

  const getCompanySizeLabel = (size?: number) => {
    if (!size) return 'Not specified';
    if (size < 50) return 'Small';
    if (size < 500) return 'Medium';
    if (size < 5000) return 'Large';
    return 'Enterprise';
  };

  const getCompanySizeColor = (size?: number) => {
    if (!size) return 'gray';
    if (size < 50) return 'blue';
    if (size < 500) return 'green';
    if (size < 5000) return 'yellow';
    return 'purple';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">Manage company profiles and business information</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<PlusIcon className="h-5 w-5" />}>
          Add Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900">{totalCompanies}</p>
              <p className="text-sm text-gray-600">Total Companies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="input pl-10 sm:w-80"
            />
          </div>

          {/* Industry Filter */}
          <div className="relative">
            <select
              value={industryFilter}
              onChange={handleIndustryFilterChange}
              className="input pr-8 appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="">All Industries</option>
              {industryTypes.map((industry) => (
                <option key={industry.industry_type_id} value={industry.industry_type_id}>
                  {industry.industry_name}
                </option>
              ))}
            </select>
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>

          {/* State Filter */}
          <div className="relative">
            <select
              value={stateFilter}
              onChange={handleStateFilterChange}
              className="input pr-8 appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state.state_id} value={state.state_id}>
                  {state.state_name}
                </option>
              ))}
            </select>
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : companies.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial Metrics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.company_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-sm">
                              {company.company_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {company.company_name}
                          </div>
                          <div className="text-sm text-gray-500">{company.legal_structure}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {company.industry_type?.industry_name || 'Not specified'}
                      </div>
                      {company.industry_type && (
                        <div className="text-xs text-gray-500">
                          Risk Category: {company.industry_type.risk_category}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getCompanySizeColor(company.company_size)} size="sm">
                        {getCompanySizeLabel(company.company_size)}
                      </Badge>
                      {company.company_size && (
                        <div className="text-xs text-gray-500 mt-1">
                          {company.company_size.toLocaleString()} employees
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {company.operating_margin !== null && company.operating_margin !== undefined
                          ? `${company.operating_margin}% margin`
                          : 'N/A'}
                      </div>
                      {company.pe_ratio && (
                        <div className="text-xs text-gray-500">P/E: {company.pe_ratio}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {company.city && company.state
                          ? `${company.city}, ${company.state.state_code}`
                          : 'Not specified'}
                      </div>
                      {company.zip_code && (
                        <div className="text-xs text-gray-500">{company.zip_code}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {irpaUtils.formatDate(company.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        to={`/irpa/companies/${company.company_id}`}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5 inline" />
                      </Link>
                      <Link
                        to={`/irpa/companies/${company.company_id}/edit`}
                        className="text-blue-600 hover:text-blue-900 ml-2"
                        title="Edit Company"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * perPage, totalCompanies)}
                      </span>{' '}
                      of <span className="font-medium">{totalCompanies}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn btn-secondary rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="btn btn-secondary rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center h-16 w-16 bg-gray-100 rounded-full">
                <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || industryFilter || stateFilter
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first company'}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<PlusIcon className="h-5 w-5" />}
            >
              Add Company
            </Button>
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCompany}
        industryTypes={industryTypes}
        states={states}
      />
    </div>
  );
};

export default IRPACompaniesPage;

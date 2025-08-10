import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatDate, getStatusColor, getRiskBadgeColor, formatNumber } from '../utils/risk';
import { useAuth } from '../contexts/AuthContext';
import { referenceDataAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: number;
  location: string;
  status: 'active' | 'inactive' | 'pending';
  riskLevel: string;
  lastAssessment: string;
  clients: number;
}

const CompaniesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<any[]>([]);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    industry_type_id: '',
    location: '',
    size: '',
    email: '',
    phone: '',
  });

  // Check if user has system_admin role (super admin)
  useEffect(() => {
    if (!user?.roles?.includes('system_admin') && !user?.roles?.includes('admin')) {
      toast.error('Access denied. System Administrator privileges required.');
      navigate('/dashboard');
    } else {
      fetchCompanies();
      fetchIndustries();
    }
  }, [user, navigate]);

  const fetchIndustries = async () => {
    try {
      const industriesData = await referenceDataAPI.getIndustryTypes();
      setIndustries(industriesData);
    } catch (error) {
      console.error('Error fetching industries:', error);
    }
  };

  // Fetch industries when modal opens
  useEffect(() => {
    if (showOnboardingModal && industries.length === 0) {
      fetchIndustries();
    }
  }, [showOnboardingModal]);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5175/api/v1/companies', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      } else {
        toast.error('Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = async () => {
    if (!onboardingData.location) {
      toast.error('Please enter a location');
      return;
    }

    setValidatingAddress(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5175/api/v1/companies/validate-address', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: onboardingData.location,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setOnboardingData({
            ...onboardingData,
            location: data.formatted_address || onboardingData.location,
          });
          setAddressValidated(true);
          toast.success('Address validated successfully');
        } else {
          toast.error('Address could not be validated. Please check and try again.');
        }
      }
    } catch (error) {
      console.error('Error validating address:', error);
      toast.error('Failed to validate address');
    } finally {
      setValidatingAddress(false);
    }
  };

  // Mock data for initial display
  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      industry: 'Technology',
      size: 500,
      location: 'New York, NY',
      status: 'active',
      riskLevel: 'Low Risk',
      lastAssessment: '2024-01-15',
      clients: 12,
    },
    {
      id: '2',
      name: 'FinanceHub Inc',
      industry: 'Financial Services',
      size: 1200,
      location: 'San Francisco, CA',
      status: 'active',
      riskLevel: 'Moderate Risk',
      lastAssessment: '2024-01-20',
      clients: 8,
    },
    {
      id: '3',
      name: 'HealthCare Plus',
      industry: 'Healthcare',
      size: 350,
      location: 'Boston, MA',
      status: 'pending',
      riskLevel: 'High Risk',
      lastAssessment: '2024-01-10',
      clients: 5,
    },
  ];

  // Use actual companies if available, otherwise use mock data
  const displayCompanies = companies.length > 0 ? companies : mockCompanies;

  const filteredCompanies = displayCompanies.filter((company) => {
    const matchesSearch =
      (company.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (company.industry?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || company.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOnboardCompany = () => {
    setShowOnboardingModal(true);
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!onboardingData.name || !onboardingData.industry || !onboardingData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!addressValidated && onboardingData.location) {
      toast.error('Please validate the address first');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/companies', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully onboarded ${onboardingData.name}`);
        if (data.email_sent) {
          toast.success('Confirmation email sent to company contact');
        }

        // Reset form and close modal
        setShowOnboardingModal(false);
        setOnboardingData({
          name: '',
          industry: '',
          location: '',
          size: '',
          email: '',
          phone: '',
        });
        setAddressValidated(false);

        // Refresh companies list
        fetchCompanies();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to onboard company');
      }
    } catch (error) {
      console.error('Error onboarding company:', error);
      toast.error('Failed to onboard company');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and monitor all registered companies</p>
        </div>
        <button
          onClick={handleOnboardCompany}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Onboard Company
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{companies.length}</p>
            </div>
            <BuildingOfficeIcon className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-success-600 mt-1">
                {companies.filter((c) => c.status === 'active').length}
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
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-error-600 mt-1">
                {companies.filter((c) => c.riskLevel === 'High Risk').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-error-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-error-500 rounded-full" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {companies.reduce((acc, c) => acc + c.clients, 0)}
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-500 rounded-full" />
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
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <FunnelIcon className="w-5 h-5 mr-2" />
              More Filters
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.location}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.industry}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(company.size)} employees
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(company.status)}`}
                    >
                      {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(company.riskLevel)}`}
                    >
                      {company.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(company.lastAssessment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-800">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button className="text-error-600 hover:text-error-800">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Onboard New Company</h2>
              <button
                onClick={() => setShowOnboardingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitOnboarding} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardingData.name}
                    onChange={(e) => setOnboardingData({ ...onboardingData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                  <select
                    required
                    value={onboardingData.industry_type_id}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, industry_type_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select industry</option>
                    {industries.map((industry) => (
                      <option key={industry.industry_type_id} value={industry.industry_type_id}>
                        {industry.industry_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={onboardingData.location}
                      onChange={(e) => {
                        setOnboardingData({ ...onboardingData, location: e.target.value });
                        setAddressValidated(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter full address"
                    />
                    <button
                      type="button"
                      onClick={validateAddress}
                      disabled={validatingAddress || !onboardingData.location}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        addressValidated
                          ? 'bg-success-600 text-white'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {validatingAddress
                        ? 'Validating...'
                        : addressValidated
                          ? 'Validated ✓'
                          : 'Validate'}
                    </button>
                  </div>
                  {addressValidated && (
                    <p className="mt-1 text-sm text-success-600">Address validated successfully</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    value={onboardingData.size}
                    onChange={(e) => setOnboardingData({ ...onboardingData, size: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select size</option>
                    <option value="1-50">1-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={onboardingData.email}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={onboardingData.phone}
                    onChange={(e) =>
                      setOnboardingData({ ...onboardingData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 mr-2" />
                  <div className="text-sm text-warning-800">
                    <p className="font-medium">Important Notice</p>
                    <p className="mt-1">
                      Onboarding a new company will trigger an initial risk assessment and send
                      welcome emails to the designated contacts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOnboardingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Onboard Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;

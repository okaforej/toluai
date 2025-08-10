import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentTextIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { clientsAPI, assessmentsAPI, referenceDataAPI } from '../services/api';
import { Client } from '../types';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CreateClientModal from '../components/Modals/CreateClientModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [industries, setIndustries] = useState<any[]>([]);

  useEffect(() => {
    loadClients();
    fetchIndustries();
  }, [searchTerm, industryFilter]);

  const fetchIndustries = async () => {
    try {
      const industriesData = await referenceDataAPI.getIndustryTypes();
      setIndustries(industriesData);
    } catch (error) {
      console.error('Error fetching industries:', error);
    }
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.list({
        search: searchTerm || undefined,
        industry: industryFilter || undefined,
        per_page: 50,
      });
      setClients(response.clients);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (clientData: Partial<Client>) => {
    try {
      await clientsAPI.create(clientData);
      toast.success('Client created successfully');
      setIsCreateModalOpen(false);
      loadClients();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create client';
      toast.error(message);
    }
  };

  const handleQuickAssessment = async (clientId: number) => {
    try {
      await assessmentsAPI.createQuick(clientId, 'Quick assessment from clients page');
      toast.success('Quick assessment created successfully');
      loadClients(); // Refresh to show updated risk scores
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create assessment';
      toast.error(message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'prospect':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getRiskBadgeVariant = (risk: string | null) => {
    if (!risk) return 'gray';
    switch (risk) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage your insurance clients and their risk profiles
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<PlusIcon className="h-5 w-5" />}>
          Add Client
        </Button>
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
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 sm:w-80"
            />
          </div>

          {/* Industry Filter */}
          <div className="relative">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer"
            >
              <option value="">All Industries</option>
              {industries.map((industry) => (
                <option key={industry.industry_type_id} value={industry.industry_type_id}>
                  {industry.industry_name}
                </option>
              ))}
            </select>
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : clients.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-sm">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {client.industry || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.annual_revenue
                          ? `$${client.annual_revenue.toLocaleString()}`
                          : 'Not specified'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {client.employee_count ? `${client.employee_count} employees` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.risk_category ? (
                        <Badge variant={getRiskBadgeVariant(client.risk_category)} size="sm">
                          {client.risk_category}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">Not assessed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(client.status)} size="sm">
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(client.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        to={`/clients/${client.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <EyeIcon className="h-5 w-5 inline" />
                      </Link>
                      <button
                        onClick={() => handleQuickAssessment(client.id)}
                        className="text-blue-600 hover:text-blue-900 ml-2"
                        title="Run Quick Assessment"
                      >
                        <DocumentTextIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center h-16 w-16 bg-gray-100 rounded-full">
                <UsersIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || industryFilter
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first client'}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<PlusIcon className="h-5 w-5" />}
            >
              Add Client
            </Button>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClient}
      />
    </div>
  );
};

export default ClientsPage;
